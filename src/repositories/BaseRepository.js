class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        return await this.model.create(data);
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async findOne(query) {
        return await this.model.findOne(query);
    }

    async findAll(query = {}, options = {}) {
        const { limit, skip, sort } = options;
        return await this.model.find(query).sort(sort).skip(skip).limit(limit);
    }

    /**
     * Advanced Finder with Pagination, Search, and Filtering
     * @param {Object} params { page, limit, search, searchFields, filter, sort, populate }
     */
    async findPaged({ page, limit, search = '', searchFields = [], filter = {}, sort = { createdAt: -1 }, populate = '' }) {
        let query = { ...filter };

        // 1. Handle Search (case-insensitive regex)
        if (search && searchFields.length > 0) {
            // Escape special regex characters
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = searchFields.map(field => ({
                [field]: { $regex: escapedSearch, $options: 'i' }
            }));
        }

        // 2. Prepare Query
        let mongoQuery = this.model.find(query).sort(sort);

        // 3. Handle Pagination (Optional)
        const isPaging = limit !== undefined && limit !== null && limit !== '';
        let p = Number(page) || 1;
        let l = Number(limit);

        if (isPaging) {
            if (isNaN(l) || l <= 0) l = 10; // Default if invalid
            if (isNaN(p) || p <= 0) p = 1;
            
            const skip = (p - 1) * l;
            mongoQuery = mongoQuery.skip(skip).limit(l);
        }

        // 4. Handle Populate
        if (populate) {
            mongoQuery = mongoQuery.populate(populate);
        }

        const [data, total] = await Promise.all([
            mongoQuery,
            this.model.countDocuments(query)
        ]);

        return {
            data,
            total,
            page: isPaging ? p : 1,
            limit: isPaging ? l : total,
            totalPages: isPaging ? Math.ceil(total / l) : 1
        };
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
    }

    async delete(id) {
        // Soft delete
        return await this.model.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
    }

    async hardDelete(id) {
        return await this.model.findByIdAndDelete(id);
    }

    async restore(id) {
        return await this.model.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
    }
}

module.exports = BaseRepository;
