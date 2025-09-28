import * as cdk from "aws-cdk-lib"
import { StackProps } from "aws-cdk-lib"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront"
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  GatewayVpcEndpointAwsService,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IpAddresses,
  KeyPair,
  KeyPairFormat,
  KeyPairType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2"
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2"
import {
  CanonicalUserPrincipal,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam"
import {
  CaCertificate,
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
} from "aws-cdk-lib/aws-rds"
import { HostedZone, IHostedZone } from "aws-cdk-lib/aws-route53"
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  HttpMethods,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import { readFileSync } from "fs"

export interface StaticSiteProps extends StackProps {
  domainName: string
  clientName: string
  projectName: string
  environment: `development` | `production`
  siteSubDomain?: string
  localEnv?: { [key: string]: string }
}

export class JaimiePortfolioStack extends cdk.Stack {
  readonly vpc: Vpc
  readonly ingressSecurityGroup: SecurityGroup

  readonly vm: Instance
  readonly db: DatabaseInstance

  readonly cmsZone: IHostedZone
  readonly cmsOAI: OriginAccessIdentity
  readonly cmsCert: Certificate
  readonly cmsImageBucket: Bucket
  readonly cmsDist: Distribution
  readonly cmsALB: ApplicationLoadBalancer

  readonly siteBucket: Bucket

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id, props)

    const {
      clientName,
      domainName,
      projectName,
      environment: envName,
      siteSubDomain,
      localEnv,
    } = props
    const projectId = `${clientName}-${projectName}-${envName.substring(0, 3)}`

    this.vpc = new Vpc(this, "InfraVPC", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: "isolatedSubnet",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 26,
          name: "publicSubnet",
          subnetType: SubnetType.PUBLIC,
        },
      ],
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      gatewayEndpoints: {
        s3: { service: GatewayVpcEndpointAwsService.S3 },
      },
    })

    this.ingressSecurityGroup = new SecurityGroup(
      this,
      "ingress-security-group",
      {
        vpc: this.vpc,
        allowAllOutbound: true,
        // securityGroupName: "IngressSecurityGroup",
      }
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(22),
      "ssh in"
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(80),
      "http in"
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(443),
      "https in"
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(1337),
      "strapi in"
    )

    this.db = new DatabaseInstance(this, `${projectId}-StrapiDB`, {
      // name can only be alphanumeric
      databaseName: "cms",
      engine: DatabaseInstanceEngine.POSTGRES,
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnets: this.vpc.isolatedSubnets }),
      credentials: Credentials.fromGeneratedSecret("db_user"),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.MICRO
      ),
      port: 5432,
      allocatedStorage: 5, // in GB
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      caCertificate: CaCertificate.RDS_CA_RSA2048_G1,
    })
    this.db.connections.allowFromAnyIpv4(Port.tcp(5432))

    const cloudfrontOAI = new OriginAccessIdentity(
      this,
      `${projectId}--cloudfrontOAI`
    )

    this.cmsImageBucket = new Bucket(this, `${projectId}-StrapiBucket`, {
      // bucket names must be unique *globally* (actual globe btw)
      // bucket names must also not use '.' or aws' wildcard ssl will fail
      bucketName: `${
        siteSubDomain ? `${siteSubDomain}-` : ``
      }strapi-${domainName.replace(".", "-")}`,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      }),
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.GET],
          // CHANGE ASAP JUST FOR TESTING
          allowedOrigins: ["*"],
          maxAge: 3000,
        },
      ],
    })
    this.cmsImageBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          // "s3:ListBucket", // this for some reason breaks the bucket
          "s3:DeleteObject",
          "s3:PutObjectAcl",
        ],
        resources: [this.cmsImageBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    )

    const vmRole = new Role(this, `${projectId}-VMRole`, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
      ],
    })
    this.vm = new Instance(this, `${projectId}-StrapiVM`, {
      instanceType: new InstanceType("t2.small"),
      // images from here: https://cloud-images.ubuntu.com/locator/ec2/
      // machineImage: MachineImage.fromSsmParameter(
      //   "/aws/service/canonical/ubuntu/server/jammy/stable/current/amd64/hvm/ebs-gp2/ami-id",
      //   { os: OperatingSystemType.LINUX }
      // ),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      role: vmRole,
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnets: this.vpc.publicSubnets }),
      securityGroup: this.ingressSecurityGroup,
      // in order to use the .pem private key you'll need to create this manually
      keyPair: new KeyPair(this, `StrapiEc2Pair-${envName}`, {
        keyPairName: `strapi-ec2-pair-${envName}`,
        format: KeyPairFormat.PEM,
        type: KeyPairType.RSA,
      }),
    })

    this.db.connections.allowFrom(
      this.vm,
      Port.tcp(parseInt(this.db.dbInstanceEndpointPort) || 5432)
    )

    let strapiScript = readFileSync("./lib/strapi/strapi-runner.sh", "utf-8")
    if (typeof localEnv !== "undefined") {
      const secretArn = this.db.secret?.secretFullArn
      if (secretArn) localEnv.SECRET_ARN = secretArn
      localEnv.DATABASE_HOST = this.db.instanceEndpoint.hostname
      localEnv.AWS_BUCKET_NAME = this.cmsImageBucket.bucketName
      const localEnvKeys = Object.keys(localEnv)
      localEnvKeys?.forEach((envVar) => {
        strapiScript = strapiScript.replaceAll(
          `{{${envVar}}}`,
          localEnv[envVar]!
        )
      })
    }
    this.vm.addUserData(strapiScript)

    // handle routing for vm
    const domainNameCms = `strapi${
      siteSubDomain ? `-${siteSubDomain}.` : `.`
    }${domainName}`
    this.cmsZone = new HostedZone(this, `${projectId}-CmsZone`, {
      zoneName: domainNameCms,
    })
    this.cmsOAI = new OriginAccessIdentity(
      this,
      `${projectId}-CmsCloudfrontOAI`
    )
    this.cmsCert = new Certificate(this, `${projectId}-CmsCertificate`, {
      domainName: domainNameCms,
    })

    // this.cmsALB = new ApplicationLoadBalancer(this, `${projectId}-CmsALB`, {
    //   vpc: this.vpc,
    // })
    // const cmsALBName = new StringParameter(this, `${projectId}-CmsALBName`, {
    //   stringValue: this.cmsALB.loadBalancerName,
    // })
    // this.cmsALB.addListener(`${projectId}-CmsALB-${cmsALBName}`, {
    //   certificates: [this.cmsCert],
    // })

    // this.cmsDist = new Distribution(this, `${projectId}-CmsDistribution`, {
    //   certificate: this.cmsCert,
    //   defaultBehavior: {
    //     origin: new HttpOrigin(domainNameCms, {}),
    //   },
    // })

    // new ARecord(this, `${projectId}-CmsARecord`, {
    //   recordName: domainNameCms,
    //   target: RecordTarget.fromAlias(new CloudFrontTarget(this.cmsDist)),
    //   zone: this.cmsZone,
    // })
  }
}
