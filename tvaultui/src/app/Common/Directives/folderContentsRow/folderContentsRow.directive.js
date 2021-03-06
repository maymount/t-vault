/*
* =========================================================================
* Copyright 2018 T-Mobile, US
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* See the readme.txt file for additional language around disclaimer of warranties.
* =========================================================================
*/

'use strict';
(function () {
    angular.module('vault.directives.folderContentsRow', [])
        .controller('folderContentsRowController', folderContentsTableController)
        .directive('folderContentsRow', function () {
            return {
                restrict: 'E',
                templateUrl: 'app/Common/Directives/folderContentsRow/folderContentsRow.html',
                scope: {
                    index: '=',
                    item: '=',
                    parent: '=',
                    loading: '=',
                    write: '='
                },
                link: function (scope) {
                    var vm = scope.vm;
                    vm.originalId = vm.item.id;
                    vm.originalValue = vm.item.value;
                    vm.isSecret = vm.item.type === 'secret';
                    if (!vm.isSecret) {
                        vm.folderName = vm.item.id.split('/').pop();
                    }
                },
                controller: 'folderContentsRowController as vm',
                bindToController: true
            }
        });

    function folderContentsTableController($scope, CopyToClipboard, SafesManagement, Modal, UtilityService, Notifications, $rootScope, toastr, safesService, $timeout) {
        var vm = this;
        vm.anyRegex = /.|\s/g;
        vm.editing = false;
        vm.originalId = '';
        vm.originalValue = '';
        vm.showPassword = false;
        init();
        vm.copyToClipboard = copyToClipboard;
        vm.onRowClick = onRowClick;
        vm.save = save;
        vm.edit = edit;
        vm.deleteSecret = deleteSecret;
        vm.deleteFolder = deleteFolder;


        function edit() {
            $rootScope.$broadcast('edit-row', vm.item.id);
            $timeout(function () {
                vm.editing = true;
            })
        }

        function copyToClipboard($event) {
            $event.stopPropagation();
            var notification = UtilityService.getAParticularSuccessMessage('COPY_TO_CLIPBOARD');
            Notifications.toast(notification);
            CopyToClipboard.copy(vm.item.value);
        }

        function onRowClick($event) {
            if (vm.editing) {
                $event.stopPropagation();
            }
        }

        function deleteSecret($event) {
            vm.loading(true);
            var modifiedFolder = {
                id: vm.parent.id,
                children: vm.parent.children.slice(0)
            };
            var index = modifiedFolder.children.findIndex(function (item) {
                return item.id === vm.item.id;
            });
            modifiedFolder.children.splice(index, 1);
            return safesService.saveFolder(modifiedFolder)
                .then(function (response) {
                    vm.loading(false);
                    vm.parent.children.splice(index, 1);
                    Notifications.toast('Deleted successfully');
                })
                .catch(catchError)
        }

        function deleteFolder($event) {
            $event.stopPropagation();
            vm.loading(true);
            return safesService.deleteFolder(vm.item.id)
                .then(function (response) {
                    vm.loading(false);
                    var index = vm.parent.children.findIndex(function (item) {
                        return item.id === vm.item.id;
                    });
                    vm.parent.children.splice(index, 1);
                    Notifications.toast('Deleted successfully');
                }).catch(catchError)
        }

        function save($event) {
            return safesService.itemIsValidToSave(vm.item, vm.index, vm.parent)
                .then(function () {
                    vm.loading(true);
                    return safesService.saveFolder(vm.parent);
                })
                .then(function (response) {
                    vm.loading(false);
                    vm.editing = false;
                    Notifications.toast('Saved successfully');
                })
                .catch(catchError);
        }

        function init() {
            $rootScope.$on('edit-row', function (event, id) {
                    if (vm.item.id === id) return;
                    vm.editing = false;
                    vm.item.id = vm.originalId;
                    vm.item.key = vm.originalId;
                    vm.item.value = vm.originalValue;
                }
            );
        }

        function catchError(error) {
            if (error) {
                vm.item.key = vm.originalId;
                vm.item.value = vm.originalValue;
                Modal.createModalWithController('stop.modal.html', {
                    title: 'Error',
                    message: 'Please try again. If this issue persists please contact an administrator.'
                });
            }
            vm.loading(false);
            console.log(error);
        }
    }
})
();