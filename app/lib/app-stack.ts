import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MySQS } from "./constructs/my-sqs/my-sqs";
import { HelloLambda } from "./constructs/hello-lambda/hello-lambda";
import { ItemApi } from "./constructs/item-api/item-api";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new MySQS(this, 'MySQS', {})

    // new HelloLambda(this, 'HelloLambda', {})

    new ItemApi(this, 'ItemApi', {})

  }
}
