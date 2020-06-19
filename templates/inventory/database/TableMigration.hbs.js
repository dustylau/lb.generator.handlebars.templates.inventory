module.exports = {
    prepareModel: function(model) { return model; },
    prepareTarget: function(target) { return target; },
    prepareItem: function(item) {
        var timeStamp = new Date()
            .toISOString()
            .replace(/[\-T\:\.Z]/g, '')
            .substring(0,12);
        
        var count = 0;
        for (const view of item.Views) {
            view.MigrationId = timeStamp + (count++).toString().padStart(4, "0");
        }    
        return item; 
    },
    prepareItemModel: function(itemModel) { return itemModel; }
};