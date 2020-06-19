module.exports = {
    prepareModel: function(model) {
        var timeStamp = new Date()
            .toISOString()
            .replace(/[\-T\:\.Z]/g, '')
            .substring(0,12);
        var count = 0;
        for (const item of model.DomainEntities) {
            item.MigrationId = timeStamp + (count++).toString().padStart(4, "0"); 
        }
        return model; 
    },
    prepareTarget: function(target) { return target; },
    prepareItem: function(item) { return item; },
    prepareItemModel: function(itemModel) { return itemModel; }
};