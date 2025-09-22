import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { HelloLambda } from "../lib/constructs/hello-lambda/hello-lambda";
import { ItemApi } from "../lib/constructs/item-api/item-api";
import { Runtime } from "aws-cdk-lib/aws-lambda";

test('ItemApi Construct Test', () => {
  // WHEN
  const stack = new cdk.Stack();
  const itemApi = new ItemApi(stack, 'MyTestItemApi', {})

  // THEN

  // CDK Synthesized into a CloudFormation Template
  const template = Template.fromStack(stack);

  // Lambda
  template.resourceCountIs('AWS::Lambda::Function', 1)
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: Runtime.NODEJS_22_X.name
  });
  template.resourceCountIs('AWS::Lambda::Permission', 2);

  // ApiGateway
  template.resourceCountIs('AWS::ApiGateway::RestApi', 1)
  template.resourceCountIs('AWS::ApiGateway::Deployment', 1)
  template.resourceCountIs('AWS::ApiGateway::Stage', 1)
  template.resourceCountIs('AWS::ApiGateway::Resource', 1)

  template.resourceCountIs('AWS::ApiGateway::Method', 2);
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    Integration: {
      IntegrationHttpMethod: "POST"
    }
  });

});
