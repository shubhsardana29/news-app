"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = void 0;
var paginate = function (data, page, limit, total) {
    var totalPages = Math.ceil(total / limit);
    return {
        data: data,
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages
    };
};
exports.paginate = paginate;
