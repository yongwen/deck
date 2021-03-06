'use strict';

const angular = require('angular');

import { includes } from 'lodash';

import { AccountService, Registry, ServicesReader } from '@spinnaker/core';

import './cloudfoundryDeployServiceStage.less';

module.exports = angular
  .module('spinnaker.cloudfoundry.pipeline.stage.deployServiceStage', [])
  .config(function() {
    Registry.pipeline.registerStage({
      provides: 'deployService',
      cloudProvider: 'cloudfoundry',
      templateUrl: require('./deployServiceStage.html'),
      executionStepLabelUrl: require('./deployServiceStepLabel.html'),
      accountExtractor: stage => [stage.context.credentials],
      configAccountExtractor: stage => [stage.credentials],
      validators: [
        { type: 'requiredField', fieldName: 'action' },
        { type: 'requiredField', fieldName: 'region' },
        { type: 'requiredField', fieldName: 'service' },
        { type: 'requiredField', fieldName: 'servicePlan', preventSave: true },
        { type: 'requiredField', fieldName: 'serviceName', preventSave: true },
        { type: 'requiredField', fieldName: 'credentials', fieldLabel: 'account' },
        { type: 'validServiceParameterJson', fieldName: 'parameters', preventSave: true },
      ],
    });
  })
  .controller('CloudfoundryDeployServiceStageCtrl', function($scope) {
    let stage = $scope.stage;
    stage.action = 'deployService';
    stage.cloudProvider = 'cloudfoundry';
    stage.tags = stage.tags || [];

    $scope.state = {
      accounts: false,
      regionsLoaded: false,
    };

    $scope.tagName = '';

    AccountService.listAccounts('cloudfoundry').then(function(accounts) {
      $scope.accounts = accounts;
      $scope.state.accounts = true;
    });

    $scope.clearAndReloadRegions = () => {
      $scope.regions = [];
      $scope.servicePlans = [];
      $scope.serviceNamesAndPlans = [];

      AccountService.getRegionsForAccount($scope.stage.credentials).then(function(regions) {
        $scope.regions = regions;
        $scope.state.regionsLoaded = true;
      });
    };

    $scope.clearAndReloadRegions();

    $scope.onAccountChange = () => {
      $scope.stage.region = null;
      $scope.state.regionsLoaded = false;
      $scope.stage.service = null;
      $scope.clearAndReloadRegions();
    };

    $scope.clearAndReloadServices = () => {
      $scope.serviceNamesAndPlans = [];
      $scope.servicePlans = [];
      $scope.services = [];

      ServicesReader.getServices($scope.stage.credentials, $scope.stage.region).then(function(services) {
        $scope.serviceNamesAndPlans = services;
        $scope.services = services.map(function(item) {
          return item.name;
        });

        $scope.onServiceChange();
      });
    };

    $scope.onRegionChange = () => {
      $scope.stage.service = null;
      $scope.stage.servicePlan = null;
      $scope.clearAndReloadServices();
    };

    if ($scope.stage.region) {
      $scope.clearAndReloadServices();
    }

    $scope.onServiceChange = () => {
      let service = $scope.serviceNamesAndPlans.find(it => it.name === $scope.stage.service) || { servicePlans: [] };
      $scope.servicePlans = service.servicePlans.map(it => it.name);
    };

    $scope.addTag = () => {
      if (!includes(stage.tags, $scope.stage.newTag)) {
        $scope.stage.tags.push($scope.stage.newTag);
      }
      $scope.stage.newTag = '';
    };

    $scope.deleteTag = function(index) {
      $scope.stage.tags.splice(index, 1);
    };
  });
