module.exports = function softDeletePlugin(schema, options) {
    const excludeDeleted = function(next) {
        if (this.getFilter().isDeleted === undefined) {
            this.where({ isDeleted: { $ne: true } });
        }
        next();
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    // For aggregate, it's a bit different as getFilter is not available
    schema.pre('aggregate', function(next) {
        this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
        next();
    });
};
