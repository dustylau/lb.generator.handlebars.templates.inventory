const Generator = require("lb.generator.handlebars");

const isEmpty = function(value) {
    return (value === undefined || value === null);
};

const mergeValue = function(value, defaultValue) {
    return isEmpty(value) ? defaultValue : value;
};

const mergeProperties = function(source, destination, options) 
{
    console.log(`Merging Properties: ${source.Name} to ${destination.Name}`);

    options = options || {};

    if (isEmpty(options.addMissingProperties))
        options.addMissingProperties = false;
    
    if (isEmpty(options.isInherited))
        options.isInherited = false;
    
    if (isEmpty(options.addPropertyCallback))
        options.addPropertyCallback = null;

    for (const sourceProperty of source.Properties) {
        var property = destination.Properties.find(p => p.Name == sourceProperty.Name);

        if (!property) {

            if (!options.addMissingProperties)
                continue;
            
            var newProperty = Object.assign({}, sourceProperty);

            if (!Generator.Helpers.hasSystemType(newProperty))
            {
                const interface = destination.Interfaces.find(i => i.InterfaceName == source.Name);
                if (interface != null) {
                    const typeParameterValue = interface.TypeParameterValues.find(v => v.Key == newProperty.Type);
                    if (typeParameterValue != null) {
                        newProperty.Type = typeParameterValue.Value;
                    }
                }
            }

            newProperty.Inherited = options.isInherited;

            if (options.addPropertyCallback) {
                options.addPropertyCallback(newProperty);
            }

            if (newProperty.IsId) {
                destination.Properties.splice(0, 0, newProperty);
                continue;
            }

            destination.Properties.push(newProperty);
            continue;
        }

        property.Name = mergeValue(property.Name, sourceProperty.Name);
        property.Description = mergeValue(property.Description, sourceProperty.Description);
        property.Type = mergeValue(property.Type, sourceProperty.Type);
        property.BaseType = mergeValue(property.BaseType, sourceProperty.BaseType);
        property.IsId = mergeValue(property.IsId, sourceProperty.IsId);
        property.IsNullable = mergeValue(property.IsNullable, sourceProperty.IsNullable);
        property.IsGenerated = mergeValue(property.IsGenerated, sourceProperty.IsGenerated);
        property.Length = mergeValue(property.Length, sourceProperty.Length);
        property.Precision = mergeValue(property.Precision, sourceProperty.Precision);
        property.Scale = mergeValue(property.Scale, sourceProperty.Scale);
        property.DefaultExpression = mergeValue(property.DefaultExpression, sourceProperty.DefaultExpression);
        property.IsEnum = mergeValue(property.IsEnum, sourceProperty.IsEnum);
        property.Enum = mergeValue(property.Enum, sourceProperty.Enum);

        property.Inherited = options.isInherited;
    }
}

const implementInterfaces = function(model, hasInterfaces, addPropertyCallback) {
    
    console.log(`Implementing interfaces in: ${hasInterfaces.Name}`);

    for (const implementedInterface of hasInterfaces.Interfaces) {

        implementedInterface.TypedInterfaceName = implementedInterface.InterfaceName;

        if (implementedInterface.TypeParameterValues) {
            implementedInterface.TypeParameterValues.sort((a, b) => b.length - a.length);
            for (const typeParameterValue of implementedInterface.TypeParameterValues) {
                const regex = new RegExp(typeParameterValue.Key, "g");
                implementedInterface.TypedInterfaceName = implementedInterface.TypedInterfaceName.replace(regex, typeParameterValue.Value);
            }
        }

        var interface = model.Interfaces.find(i => i.Name == implementedInterface.InterfaceName);

        if (!interface)
            throw `Interface not found: ${implementedInterface.InterfaceName}`;

        if (!hasInterfaces.Namespaces)
            hasInterfaces.Namespaces = [];

        if (interface.Namespace) {
            if (!hasInterfaces.Namespaces.find(namespace => namespace == interface.Namespace))
            {
                hasInterfaces.Namespaces.push(interface.Namespace);
            }
        }

        if (!interface.hasBeenMapped) {
            implementInterfaces(model, interface, addPropertyCallback);
        }

        mergeProperties(
            interface, 
            hasInterfaces, 
            { 
                addMissingProperties: true, 
                isInherited: true, 
                addPropertyCallback: addPropertyCallback 
            }
        );
    }

    hasInterfaces.hasBeenMapped = true;
};

const setPropertyDefaults = function(model, hasProperties) 
{
    var defaultStringLength = 50;
    var defaultPrecision = 18;
    var defaultScale = 5;

    if (isEmpty(model.CustomProperties))
        model.CustomProperties = {};
    
    if (!isEmpty(model.CustomProperties.DefaultStringLength))
        defaultStringLength = mergeValue(model.CustomProperties.DefaultStringLength.Value, 50);
    
    if (!isEmpty(model.CustomProperties.DefaultPrecision))
        defaultPrecision = mergeValue(model.CustomProperties.DefaultPrecision.Value, 18);
    
    if (!isEmpty(model.CustomProperties.DefaultScale))
        defaultScale = mergeValue(model.CustomProperties.DefaultScale.Value, 5);

    for (const property of hasProperties.Properties) {
        var type = property.BaseType || property.Type;

        if (!type)
            type = "string";
        
        if (type.toUpperCase() == "STRING") {
            property.Length = mergeValue(property.Length, defaultStringLength);
            continue;
        }
        
        if (type.toUpperCase() == "DECIMAL" || type.toUpperCase() == "DOUBLE") {
            property.Precision = mergeValue(property.Precision, defaultPrecision);
            property.Scale = mergeValue(property.Scale, defaultScale);
            continue;
        }
    }
};

const prepare = function(model) {

    for (const interface of model.Interfaces) {
        console.log(`Interface: ${interface.Name}: Settings Property Defaults...`);
        setPropertyDefaults(model, interface);
    }

    for (const interface of model.Interfaces) {
        console.log(`Interface: ${interface.Name}: Implementing Interfaces...`);
        implementInterfaces(model, interface);
    }

    for (const entity of model.DomainEntities) {
        console.log(`Entity: ${entity.Name}: Implementing Interfaces...`);
        implementInterfaces(model, entity);
        console.log(`Entity: ${entity.Name}: Settings Property Defaults...`);
        setPropertyDefaults(model, entity);

        for(const property of entity.Properties) {
            if (!property.IsEnum)
                continue;
            
            var enumValue = model.DomainEnums.find(e => e.Name == property.Enum.Name);

            if (!enumValue)
                continue;

            property.EnumValue = enumValue;
        }

        entity.idProperty = entity.Properties.find(property => property.IsId);

        entity.getActionByEvent = function(event) {
            return this.Actions.find(function(action) {
                return action.Event == event;
            });
        };

        for (const action of entity.Actions) {
            implementInterfaces(model, action, function(interfaceProperty) {
                interfaceProperty.IsRequestParameter = true;
                interfaceProperty.IsIncludedInResponse = false;
            });
            mergeProperties(entity, action);
            setPropertyDefaults(model, action);;
        }

        for (const view of entity.Views) {
            implementInterfaces(model, view);
            mergeProperties(entity, view);
            setPropertyDefaults(model, view);
        }

        for (const view of entity.Views) {

            view.idProperty = view.Properties.find(property => property.IsId);

            if (view.idProperty) {
                view.idProperty = { Name: 'Id', Type: 'long' };
            }

            view.dtoName = `${view.Name}Dto`
            view.dtoInstance = `${Generator.Helpers.camelCase(view.dtoName)}`;

            for (const event of view.Events) {
                event.relatedAction = entity.getActionByEvent(event.Name);
                event.hasAction = event.action ? true : false;
                event.actionProperty = event.relatedAction.Properties.find(property => property.Name == view.idProperty.Name);

                if (!event.actionProperty)
                    event.actionProperty = event.relatedAction.Properties.find(property => property.Name == `${entity.Name}${view.idProperty.Name}`);

                event.dtoName = view.dtoName;
                event.dtoInstance = view.dtoInstance;
                event.eventAction = event.Action ? event.Action.replace("${dto}", event.dtoInstance) : null;
                event.eventCondition = event.Condition ? event.Condition.replace("${dto}", event.dtoInstance) : null;
            }
        }
    }

    for (const entity of model.DomainEntities) {
        console.log(`Entity: ${entity.Name}: Mapping relations...`);
        for (const relation of entity.Relations) {
            console.log(`Entity: ${entity.Name}: Mapping relation ${relation.Name}...`);
            var relatedEntity = model.DomainEntities.find(e => e.Name == relation.RelatedEntity);
            if (relatedEntity == null) {
                console.log(`Entity: ${entity.Name}: Mapping relation ${relation.Name}: ERROR: Related entity not found.`);
                continue;
            }
            relation.relatedEntityIdProperty = relatedEntity.idProperty;
        }
    }

    for (const customProperty in model.CustomProperties) {
        var property = model.CustomProperties[customProperty];
        model[property.Name] = property.Value;
    }
};

exports.prepare = prepare;