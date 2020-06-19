module.exports = {
    prepareModel: function(model) {
        for (const domainEntity of model.DomainEntities) {

            model.FirstAggregate = domainEntity.Name;

            for (const view of domainEntity.Views) {
                model.FirstView = view.Name;
                break;
            }

            for (const action of domainEntity.Actions) {
                model.FirstEvent = action.Event;
                break;
            }

            break;    
        }

        return model; 
    },
    prepareTarget: function(target) { return target; },
    prepareItem: function(item) { return item; },
    prepareItemModel: function(itemModel) { return itemModel; }
};