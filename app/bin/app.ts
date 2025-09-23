#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStage } from '../lib/stages/AppStage';

const app = new cdk.App();

new AppStage(app, 'Dev', {
  env: {
    account: '000000000000',
    region: 'eu-north-1' // Stockholm region
  }
});

new AppStage(app, 'Prod', {
  env: {
    // Normally, prod account would be different from dev account
    // However, localStack makes cross-account work difficult for us
    account: '000000000000',
    // Instead, let's change the region! À Paris, bien sûr!
    region: 'eu-west-3' // Paris region
  }
});
