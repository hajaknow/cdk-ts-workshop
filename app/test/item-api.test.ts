import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ItemApi } from '../lib/constructs/item-api/item-api';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

test('ItemApi Construct Test', () => {
  // WHEN
  const stack = new cdk.Stack();
  new ItemApi(stack, 'MyTestItemApi', {});

  // THEN

  // CDK Synthesized into a CloudFormation Template
  const template = Template.fromStack(stack);

  // --------------
  // Lambda
  // --------------

  template.resourceCountIs('AWS::Lambda::Function', 2);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: Runtime.NODEJS_22_X.name
  });
  template.resourceCountIs('AWS::Lambda::Permission', 4);

  // --------------
  // ApiGateway
  // --------------

  template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  template.resourceCountIs('AWS::ApiGateway::Deployment', 1);


  template.resourceCountIs('AWS::ApiGateway::Resource', 2);
  template.hasResourceProperties('AWS::ApiGateway::Resource', { PathPart: 'items' });
  template.hasResourceProperties('AWS::ApiGateway::Method', { HttpMethod: 'POST' });

  template.hasResourceProperties('AWS::ApiGateway::Resource', { PathPart: '{id}' });
  template.hasResourceProperties('AWS::ApiGateway::Method', { HttpMethod: 'GET' });

  // --------------
  // DynamoDB
  // --------------

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'items',

    // Schema verification :)
    AttributeDefinitions: [
      { AttributeName: 'itemId', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'itemId', KeyType: 'HASH' }
    ]
  });

  template.hasResource('AWS::DynamoDB::Table', {
    // Deletion policy verification
    UpdateReplacePolicy: 'Delete',
    DeletionPolicy: 'Delete',

    // Property verification
    Properties: {
      TableName: 'items',
      AttributeDefinitions: [
        { AttributeName: 'itemId', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'itemId', KeyType: 'HASH' }
      ]
    }
  });

});
