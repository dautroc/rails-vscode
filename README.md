# Rails VSCode Navigator

Rails VSCode Navigator is a Visual Studio Code extension designed to streamline navigation within Ruby on Rails projects. Quickly jump between related files and definitions with a few simple commands.

## Features

This extension provides the following commands, accessible via the VS Code Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

### 1. Rails: Toggle Implementation/Spec File

*   **Command ID:** `rails-vscode.toggleImplementationSpec`
*   **Description:** Allows you to quickly switch between a Ruby implementation file and its corresponding RSpec test file, and vice-versa.
*   **Supported Scenarios:**
    *   From an implementation file in `app/models/`, `app/controllers/`, `app/services/`, `app/jobs/`, `app/helpers/`, `app/mailers/`, or `lib/` to its spec file in `spec/`.
        *   Example: `app/models/user.rb` <-> `spec/models/user_spec.rb`
        *   Example: `lib/payment_processor.rb` <-> `spec/lib/payment_processor_spec.rb`
    *   From a spec file in `spec/` (e.g., `spec/models/user_spec.rb`) back to its implementation file.

### 2. Rails: Navigate Model/Schema Definition

*   **Command ID:** `rails-vscode.navigateToModelSchema`
*   **Description:** Provides bidirectional navigation between Rails model files and their table definitions in `db/schema.rb`.
*   **Supported Scenarios:**
    *   **Model to Schema:** When the currently open file is a Rails model (e.g., `app/models/user.rb`), this command will open `db/schema.rb` and jump to the line where the `create_table "users"` block is defined.
    *   **Schema to Model:** When the currently open file is `db/schema.rb` and your cursor is within or near a `create_table "table_name"` block, this command will open the corresponding model file (e.g., if in `create_table "users"`, it will open `app/models/user.rb`).

## Requirements

*   The extension must be used within a Ruby on Rails project that follows standard directory conventions (e.g., `app/models`, `spec/models`, `db/schema.rb`).
*   RSpec conventions for spec file naming (e.g., `_spec.rb` suffix) are expected for the toggle feature.

## Known Issues & Limitations

*   **Pluralization/Singularization:** The model-to-table name conversion (and vice-versa) uses a simplified set of rules. It handles common English plurals (s, es, ies) but may not correctly convert all irregular nouns (e.g., "person" to "people" or "mouse" to "mice").
*   **Spec File Location:** The toggle spec/implementation feature primarily assumes standard Rails directory structures. Highly customized spec locations might not be resolved correctly.
*   **Schema Parsing:** Navigation from `schema.rb` to a model relies on finding a `create_table` definition by searching upwards from the cursor. This might not work if the schema file is heavily modified or the cursor is too far from the definition.