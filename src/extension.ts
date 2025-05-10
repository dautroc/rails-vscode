import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "rails-vscode" is now active!');

    let toggleImplementationSpec = vscode.commands.registerCommand('rails-vscode.toggleImplementationSpec', () => {
        vscode.window.showInformationMessage('Toggle Implementation/Spec File command executed!');
    });

    let goToSchemaDefinition = vscode.commands.registerCommand('rails-vscode.goToSchemaDefinition', () => {
        vscode.window.showInformationMessage('Go to Schema Definition command executed!');
    });

    context.subscriptions.push(toggleImplementationSpec);
    context.subscriptions.push(goToSchemaDefinition);
}

export function deactivate() {} 