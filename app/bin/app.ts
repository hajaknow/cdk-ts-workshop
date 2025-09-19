#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();
new AppStack(app,
  'AppStack',
  {
    env: {
      account: "000000000000",
      region: "eu-north-1"
    }
  }
);
