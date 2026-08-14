import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LeafCare Multilingual Agricultural Advisory API',
      version: '1.0.0',
      description:
        'Production REST API for LeafCare agronomy catalog, plant pathology remedies, multilingual content, and community platform.',
      contact: {
        name: 'LeafCare Engineering Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
