# contentful-test-app

## Step 1
Run

> npm run create-app-definition

and follow the prompts to create an app definition. Allow the app to be rendered in
* "App configuration screen"
* "Entry field"
and allow the field type "JSON object" to be rendered as well.

## Step 2

Every time you make a change to the app, run

> npm run build

to build the app. This will create a `dist` folder with the app's files.

## Step 3

Run

> npm run upload

and chose to activate the app right away to upload it to Contentful. This will create a new version of the app and update the app definition. It will automatically be hosted by Contentful. Now you can navigate to "Organization settings" / "Apps" within Contentful and click on the app you've just uploaded. You can now add the app to your space.
