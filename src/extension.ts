import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "rails-vscode" is now active!');

    let toggleImplementationSpec = vscode.commands.registerCommand('rails-vscode.toggleImplementationSpec', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

        const currentFilePath = editor.document.fileName;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        let targetFilePath: string | undefined;

        const relativePath = path.relative(workspaceRoot, currentFilePath);

        if (relativePath.startsWith('spec/')) {
            // Current file is a spec file, try to find implementation
            if (relativePath.endsWith('_spec.rb')) {
                let potentialPath = relativePath.replace(/^spec\//, 'app/');
                potentialPath = potentialPath.replace(/_spec\.rb$/, '.rb');
                
                // Common locations to check within app/
                const commonAppDirs = ['models', 'controllers', 'services', 'jobs', 'helpers', 'mailers', 'lib'];
                // Check spec subdirectories like spec/models, spec/controllers
                const specSubDir = relativePath.split(path.sep)[1]; // e.g., 'models' from 'spec/models/user_spec.rb'

                if (commonAppDirs.includes(specSubDir)) {
                     targetFilePath = path.join(workspaceRoot, 'app', specSubDir, path.basename(potentialPath));
                     if (!fs.existsSync(targetFilePath)) {
                        // Fallback for lib files that might be in spec/lib/
                        if (specSubDir === 'lib') {
                            targetFilePath = path.join(workspaceRoot, 'lib', path.basename(potentialPath));
                        } else {
                             // If not in a direct app subfolder, try to construct path from spec/<type>/
                            potentialPath = relativePath.replace(/^spec\/((?!lib\/)[^/]+\/)/, 'app/$1').replace(/_spec\.rb$/, '.rb');
                            targetFilePath = path.join(workspaceRoot, potentialPath);
                        }
                     }
                } else if (relativePath.startsWith('spec/lib/')) { // spec/lib/some_module_spec.rb -> lib/some_module.rb
                    potentialPath = relativePath.replace(/^spec\/lib\//, 'lib/').replace(/_spec\.rb$/, '.rb');
                    targetFilePath = path.join(workspaceRoot, potentialPath);
                } else {
                    // Generic fallback for spec files: spec/foo_spec.rb -> app/foo.rb (less common)
                    potentialPath = relativePath.replace(/^spec\//, 'app/').replace(/_spec\.rb$/, '.rb');
                    targetFilePath = path.join(workspaceRoot, potentialPath);
                }


            }
        } else if (relativePath.startsWith('app/') || relativePath.startsWith('lib/')) {
            // Current file is an implementation file, try to find spec
            if (relativePath.endsWith('.rb')) {
                let potentialPath = relativePath.replace(/\.rb$/, '_spec.rb');
                if (relativePath.startsWith('app/')) {
                    targetFilePath = path.join(workspaceRoot, 'spec', potentialPath.substring('app/'.length));
                } else { // lib/
                    targetFilePath = path.join(workspaceRoot, 'spec', 'lib', path.basename(potentialPath));
                     if (!fs.existsSync(targetFilePath)) { // Check if it's spec/نام_پوشه_درون_lib/نام_فایل_spec.rb
                        const libSubfolder = path.dirname(relativePath).substring('lib/'.length);
                        if (libSubfolder) {
                            targetFilePath = path.join(workspaceRoot, 'spec', 'lib', libSubfolder, path.basename(potentialPath));
                        }
                    }
                }
            }
        }

        if (targetFilePath && fs.existsSync(targetFilePath)) {
            const targetDocument = await vscode.workspace.openTextDocument(targetFilePath);
            await vscode.window.showTextDocument(targetDocument);
        } else if (targetFilePath) {
            vscode.window.showInformationMessage(`Corresponding file not found at: ${path.relative(workspaceRoot, targetFilePath)}`);
        } else {
            vscode.window.showInformationMessage('Could not determine a corresponding spec/implementation file.');
        }
    });

    let goToSchemaDefinition = vscode.commands.registerCommand('rails-vscode.goToSchemaDefinition', () => {
        vscode.window.showInformationMessage('Go to Schema Definition command executed!');
    });

    context.subscriptions.push(toggleImplementationSpec);
    context.subscriptions.push(goToSchemaDefinition);
}

export function deactivate() {} 