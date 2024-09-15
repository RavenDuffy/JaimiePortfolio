import * as cdk from "aws-cdk-lib"
import { StackProps } from "aws-cdk-lib"
import { OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront"
import {
  GatewayVpcEndpointAwsService,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IpAddresses,
  KeyPair,
  KeyPairFormat,
  KeyPairType,
  MachineImage,
  OperatingSystemType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2"
import { CanonicalUserPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam"
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
} from "aws-cdk-lib/aws-rds"
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

export interface StaticSiteProps extends StackProps {
  domainName: string
  clientName: string
  projectName: string
  environment: `development` | `production`
  siteSubDomain: string
}

export class JaimiePortfolioStack extends cdk.Stack {
  readonly vpc: Vpc
  readonly ingressSecurityGroup: SecurityGroup
  readonly egressSecurityGroup: SecurityGroup

  readonly vm: Instance
  readonly db: DatabaseInstance

  readonly imageBucket: Bucket

  constructor(scope: Construct, id: string, props: StaticSiteProps) {
    super(scope, id, props)

    const {
      clientName,
      domainName,
      projectName,
      environment: envName,
      siteSubDomain,
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
        allowAllOutbound: false,
        securityGroupName: "IngressSecurityGroup",
      }
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(22)
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(80)
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(443)
    )
    this.ingressSecurityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(1337)
    )

    this.egressSecurityGroup = new SecurityGroup(
      this,
      "egress-security-group",
      {
        vpc: this.vpc,
        allowAllOutbound: false,
        securityGroupName: "EgressSecurityGroup",
      }
    )
    this.egressSecurityGroup.addEgressRule(Peer.ipv4("0.0.0.0/0"), Port.tcp(22))
    this.egressSecurityGroup.addEgressRule(Peer.ipv4("0.0.0.0/0"), Port.tcp(80))
    this.egressSecurityGroup.addEgressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(443)
    )
    this.egressSecurityGroup.addEgressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(1337)
    )

    this.vm = new Instance(this, `${projectId}-StrapiVM`, {
      instanceType: new InstanceType("t2.small"),
      // images from here: https://cloud-images.ubuntu.com/locator/ec2/
      machineImage: MachineImage.fromSsmParameter(
        "/aws/service/canonical/ubuntu/server/jammy/stable/current/amd64/hvm/ebs-gp2/ami-id",
        { os: OperatingSystemType.LINUX }
      ),
      vpc: this.vpc,
      securityGroup: this.ingressSecurityGroup,
      // in order to use the .pem private key you'll need to create this manually
      keyPair: new KeyPair(this, "StrapiEc2Pair", {
        keyPairName: "strapi-ec2-pair",
        format: KeyPairFormat.PEM,
        type: KeyPairType.RSA,
      }),
    })

    this.db = new DatabaseInstance(this, `${projectId}-StrapiDB`, {
      // name can only be alphanumeric
      databaseName: "strapipostgres",
      engine: DatabaseInstanceEngine.POSTGRES,
      vpc: this.vpc,
      vpcSubnets: this.vpc.selectSubnets({ subnets: this.vpc.isolatedSubnets }),
      credentials: Credentials.fromGeneratedSecret("CDK_USER"),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.MICRO
      ),
      port: 5432,
      // in GB
      allocatedStorage: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    })
    this.db.connections.allowFromAnyIpv4(Port.tcp(5432))

    const cloudfrontOAI = new OriginAccessIdentity(
      this,
      `${projectId}--cloudfrontOAI`
    )

    this.imageBucket = new Bucket(this, `${projectId}-StrapiBucket`, {
      // bucket names must be unique *globally* (actual globe btw)
      bucketName: `${siteSubDomain}-strapi.${domainName}`,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: true,
        restrictPublicBuckets: true,
      }),
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.GET],
          // CHANGE ASAP JUST FOR TESTING
          allowedOrigins: ["*"],
        },
      ],
    })
    this.imageBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
        ],
        resources: [this.imageBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    )
  }
}
