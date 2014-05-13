﻿'use strict'

angular.module("umbraco").controller("RJP.MultiUrlPickerController", function($scope, dialogService, iconHelper, entityResource) {
  var documentIds = []
    , mediaIds = []

  $scope.renderModel = []
  $scope.cfg = { maxNumberOfItems: 0, minNumberOfItems: 0 }

  if( $scope.model.value ) {
    _.each($scope.model.value, function( item, i ) {
      $scope.renderModel.push({
          name: item.name
        , id: item.id
        , url: item.url
        , target: item.target
        , isMedia: item.isMedia
        , icon: item.icon || 'icon-link'
      })
      if( item.id ) {
        (item.isMedia ? mediaIds : documentIds).push( item.id )
      }
    })
  }

  var setIcon = function( nodes ) {
    if( _.isArray( nodes ) ) {
      _.each( nodes, setIcon )
    } else {
      var item = _.find( $scope.renderModel, function( item ) {
        return +item.id === nodes.id
      })
      item.icon = iconHelper.convertFromLegacyIcon( nodes.icon );
    }
  }

  entityResource.getByIds( documentIds, 'Document' ).then( setIcon )
  entityResource.getByIds( mediaIds, 'Media' ).then( setIcon )

  if ( $scope.model.config ) {
    $scope.cfg = angular.extend( $scope.cfg, $scope.model.config )
  }

  if( $scope.cfg.maxNumberOfItems <= 0 ) { 
    delete $scope.cfg.maxNumberOfItems
  }
  if( $scope.cfg.minNumberOfItems <= 0 ) { 
    $scope.cfg.minNumberOfItems = 0
  }

  $scope.openLinkPicker = function() {
    dialogService.linkPicker({ callback: $scope.onContentSelected })
  }
  
  $scope.edit = function(index) {
    var link = $scope.renderModel[index]
    dialogService.linkPicker({
        currentTarget: {
            id: link.isMedia ? null : link.id // the linkPicker breaks if it get an id for media
          , index: index
          , name: link.name
          , url: link.url
          , target: link.target
          , isMedia: link.isMedia
        }
      , callback: $scope.onContentSelected
    })
  }

  $scope.remove = function(index) {
    $scope.renderModel.splice( index, 1 )
    $scope.model.value = $scope.renderModel
  }	    
  
  $scope.$watch(
      function() {
          return _.map($scope.renderModel, function ( i ) { return i.id }).join()
      }
    , function(newVal) {
        if( $scope.renderModel.length ) {
          $scope.model.value = $scope.renderModel
        } else {
          $scope.model.value = null
        }

        if( $scope.cfg.minNumberOfItems && +$scope.cfg.minNumberOfItems > $scope.renderModel.length ) {
          $scope.multiUrlPickerForm.minCount.$setValidity( 'minCount', false )
        } else {
          $scope.multiUrlPickerForm.minCount.$setValidity( 'minCount', true )
        }
         if( $scope.cfg.maxNumberOfItems && +$scope.cfg.maxNumberOfItems < $scope.renderModel.length ) {
          $scope.multiUrlPickerForm.maxCount.$setValidity( 'maxCount', false )
        } else {
          $scope.multiUrlPickerForm.maxCount.$setValidity( 'maxCount', true )
        }
      }
  )

  $scope.$on("formSubmitting", function(ev, args) {
    if( $scope.renderModel.length ) {
      $scope.model.value = $scope.renderModel
    } else {
      $scope.model.value = null
    }
  })


  $scope.onContentSelected = function(e) {
    var link = {
          id: e.id
        , name: e.name
        , url: e.url
        , target: e.target
        , isMedia: e.isMedia
        , icon: 'icon-link'
    }

    if( e.index != null ) {
      $scope.renderModel[ e.index ] = link
    } else {
      $scope.renderModel.push( link )
    }

    if( e.id ) {
      entityResource.getById( e.id, e.isMedia ? 'Media' : 'Document' ).then( setIcon )
    }

    $scope.model.value = $scope.renderModel
    dialogService.closeAll()
  }
})