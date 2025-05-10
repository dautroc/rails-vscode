import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function pluralize(name: string): string {
    if (name.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(name.slice(-2, -1).toLowerCase())) {
        return name.slice(0, -1) + 'ies'; // category -> categories
    }
    if (/(s|x|z|ch|sh)$/i.test(name)) {
        return name + 'es'; // bus -> buses, box -> boxes, church -> churches, address -> addresses
    }
    // status -> statuses (covered by above)
    return name + 's'; // user -> users, post -> posts
}

function singularize(name: string): string {
    if (name.endsWith('ies') && name.length > 3) { // categories -> category
        return name.slice(0, -3) + 'y';
    }
    // buses -> bus, boxes -> box, churches -> church, addresses -> address, statuses -> status
    if (name.endsWith('es') && name.length > 2) {
        const base = name.slice(0, -2);
        // Check if the original was like 'box' from 'boxes' or 'address' from 'addresses'
        // This simple slice works for many common cases like (s,x,z,ch,sh) + es
        return base;
    }
    if (name.endsWith('s') && !name.endsWith('ss') && name.length > 1) { // users -> user, posts -> post
        return name.slice(0, -1);
    }
    return name; // Default: no change if no rule matches or it's already singular (e.g. "data")
}

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

    let navigateToModelSchema = vscode.commands.registerCommand('rails-vscode.navigateToModelSchema', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        const currentFilePath = document.fileName;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const relativePath = path.relative(workspaceRoot, currentFilePath);

        // Case 1: Current file is db/schema.rb -- Go to Model
        if (relativePath === path.join('db', 'schema.rb')) {
            const cursorPosition = editor.selection.active;
            let tableName: string | null = null;
            const searchLimit = Math.max(0, cursorPosition.line - 10); // Search up to 10 lines above cursor

            for (let i = cursorPosition.line; i >= searchLimit; i--) {
                const lineText = document.lineAt(i).text;
                const match = lineText.match(/^\s*create_table\s+"([^"]+)"/);
                if (match && match[1]) {
                    tableName = match[1];
                    break;
                }
            }

            if (tableName) {
                const modelName = singularize(tableName);
                const modelPath = path.join(workspaceRoot, 'app', 'models', `${modelName}.rb`);

                if (fs.existsSync(modelPath)) {
                    const modelDocument = await vscode.workspace.openTextDocument(modelPath);
                    await vscode.window.showTextDocument(modelDocument);
                } else {
                    vscode.window.showInformationMessage(`Model file not found: app/models/${modelName}.rb`);
                }
            } else {
                vscode.window.showInformationMessage('Could not find "create_table" definition near cursor. Please ensure cursor is within or near a table block.');
            }
        }
        // Case 2: Current file is a Model -- Go to schema.rb
        else if (relativePath.startsWith(path.join('app', 'models')) && currentFilePath.endsWith('.rb')) {
            const modelName = path.basename(currentFilePath, '.rb');
            const tableName = pluralize(modelName);
            const schemaFilePath = path.join(workspaceRoot, 'db', 'schema.rb');

            if (!fs.existsSync(schemaFilePath)) {
                vscode.window.showErrorMessage('db/schema.rb not found.');
                return;
            }

            try {
                const schemaContent = fs.readFileSync(schemaFilePath, 'utf-8');
                const lines = schemaContent.split('\n');
                const searchString = `create_table "${tableName}"`;
                let lineNumber = -1;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(searchString)) {
                        lineNumber = i;
                        break;
                    }
                }

                if (lineNumber !== -1) {
                    const schemaUri = vscode.Uri.file(schemaFilePath);
                    const schemaDoc = await vscode.workspace.openTextDocument(schemaUri);
                    const position = new vscode.Position(lineNumber, 0);
                    await vscode.window.showTextDocument(schemaDoc, { selection: new vscode.Selection(position, position) });
                } else {
                    vscode.window.showInformationMessage(`Table definition for "${tableName}" not found in db/schema.rb.`);
                }
            } catch (error) {
                vscode.window.showErrorMessage('Error reading db/schema.rb.');
                console.error(error);
            }
        }
        // Case 3: Not a recognized file for this command
        else {
            vscode.window.showInformationMessage('Please use this command from a Rails model file (e.g., app/models/user.rb) or from db/schema.rb.');
        }
    });

    context.subscriptions.push(toggleImplementationSpec);
    context.subscriptions.push(navigateToModelSchema);
}

export function deactivate() {} 