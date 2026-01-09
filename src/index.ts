import serverless from '@vendia/serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import app from './app';

let serverlessExpressInstance: any;

async function setup(event: APIGatewayProxyEvent, context: Context) {
  serverlessExpressInstance = serverless({ app });
  return serverlessExpressInstance(event, context);
}

function handler(event: APIGatewayProxyEvent, context: Context) {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  return setup(event, context);
}

export { handler };
