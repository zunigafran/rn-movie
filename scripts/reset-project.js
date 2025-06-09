#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /app, /components, /hooks, /scripts, and /constants directories to /app-example based on user input and creates a new /app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to execute commands safely
function executeCommand(command) {
  try {
    console.log(`\n📝 Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(error.message);
  }
}

// Clear Metro bundler cache
console.log('\n🧹 Clearing Metro bundler cache...');
executeCommand('rm -rf $TMPDIR/metro-*');

// Clear Expo cache (using user's home directory)
console.log('\n🧹 Clearing Expo cache...');
const homeDir = os.homedir();
const expoCachePath = path.join(homeDir, '.expo');
if (fs.existsSync(expoCachePath)) {
  try {
    fs.rmSync(expoCachePath, { recursive: true, force: true });
    console.log('✅ Expo cache cleared successfully');
  } catch (error) {
    console.error('❌ Could not clear Expo cache:', error.message);
    console.log('⚠️ You may need to manually delete the ~/.expo directory');
  }
}

// Remove node_modules and reinstall
console.log('\n🗑️ Removing node_modules...');
executeCommand('rm -rf node_modules');
console.log('\n📦 Reinstalling dependencies...');
executeCommand('npm install');

// Clear watchman cache
console.log('\n🧹 Clearing Watchman cache...');
executeCommand('watchman watch-del-all');

// Create a fresh .watchmanconfig if it doesn't exist
const watchmanConfigPath = path.join(process.cwd(), '.watchmanconfig');
if (!fs.existsSync(watchmanConfigPath)) {
  console.log('\n📝 Creating fresh .watchmanconfig...');
  fs.writeFileSync(watchmanConfigPath, '{}');
}

console.log('\n✨ Project reset complete!');
console.log('\nNext steps:');
console.log('1. Run "npx expo start" to start your project');
console.log('2. If you encounter any issues, try running "npm run reset-project" again');

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      `1. Run \`npx expo start\` to start a development server.${
        userInput === "y"
          ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  "Do you want to move existing files to /app-example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
