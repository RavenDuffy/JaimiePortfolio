import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksImageAndText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_image_and_texts';
  info: {
    displayName: 'Image and Text';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.image-and-text': BlocksImageAndText;
    }
  }
}
