const fs = require('fs');
const Handlebars = require("handlebars");
const Generator = require('lb.generator.handlebars');
const pluralize = require('pluralize');

Handlebars.registerHelper('pluralize', function(context) {
    return pluralize(context);
});

const preparer = require('./models/inventory/prepare-inventory-model');

const model = require('./models/inventory/inventory-model.json');

preparer.prepare(model);

// By default, the templates will be generated with the following default global static values:
Generator.TemplateSettings.DefaultTarget = "Model";
Generator.TemplateSettings.DefaultTargetItem = "entity";
Generator.TemplateSettings.DefaultTargetProperty = "entities";
Generator.TemplateSettings.DefaultModelProperty = "domain";
Generator.TemplateSettings.DefaultTargetItemNameProperty = "Name";

// Create a Template Loader and pass it the directory containing the templates.
// The loader will automatically load all template files ending in ".hbs" and their corresponding settings ".hbs.settings.json"
var loader = new Generator.TemplateLoader('./templates');
// Load the templates
loader.load();
// Generate the loaded templates.
loader.generate(model, (loader) => { console.log("Templates Generated."); });