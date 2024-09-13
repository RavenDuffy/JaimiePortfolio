import type { Schema, Attribute } from '@strapi/strapi';

export interface MetadataSeo extends Schema.Component {
  collectionName: 'components_metadata_seos';
  info: {
    displayName: 'seo';
    icon: 'earth';
  };
  attributes: {
    metaTitle: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'metadata.seo': MetadataSeo;
    }
  }
}
