/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import vscode = require('vscode');
import { IActionContext } from 'vscode-azureextensionui';
import { dockerExplorerProvider } from '../dockerExtension';
import { ContainerNode } from '../explorer/models/containerNode';
import { RootNode } from '../explorer/models/rootNode';
import { AllStatusFilter, docker, ListContainerDescOptions } from './utils/docker-endpoint';
import { quickPickContainerOrAll } from './utils/quick-pick-container';

const teleCmdId: string = 'vscode-docker.container.remove';

export async function removeContainer(actionContext: IActionContext, context: RootNode | ContainerNode | undefined): Promise<void> {

    let containersToRemove: Docker.ContainerDesc[];

    if (context instanceof ContainerNode && context.containerDesc) {
        containersToRemove = [context.containerDesc];
    } else {
        const opts: ListContainerDescOptions = {
            "filters": {
                "status": AllStatusFilter
            }
        };
        containersToRemove = await quickPickContainerOrAll(actionContext, opts);

    }

    const numContainers: number = containersToRemove.length;
    let containerCounter: number = 0;

    vscode.window.setStatusBarMessage("Docker: Removing Container(s)...", new Promise((resolve, reject) => {
        containersToRemove.forEach((c) => {
            // tslint:disable-next-line:no-function-expression no-any // Grandfathered in
            docker.getContainer(c.Id).remove({ force: true }, function (err: Error, _data: any): void {
                containerCounter++;
                if (err) {
                    // TODO: parseError, proper error handling
                    vscode.window.showErrorMessage(err.message);
                    dockerExplorerProvider.refreshContainers();
                    reject();
                }
                if (containerCounter === numContainers) {
                    dockerExplorerProvider.refreshContainers();
                    resolve();
                }
            });
        });
    }));
}
