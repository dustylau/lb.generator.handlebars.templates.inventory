module.exports = {
    prepareModel: function(model) { return model; },
    prepareTarget: function(target) { return target; },
    prepareItem: function(item) {
        item.dtoName = `${item.Name}Dto`;
        return item; 
    },
    prepareItemModel: function(itemModel) { return itemModel; }
};