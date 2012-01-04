var App = {};

var Router = {
    
    PROXY_PREFIX : 'proxy.php?route=',
    
    get: function(path,callback){
        return $.get(this.PROXY_PREFIX + path,callback,'json');
    },
    
    post: function(path,data,callback){
        return $.post(this.PROXY_PREFIX + path,data,callback,'json');
    }
}

var DB = {
    
    FIND_PATH: 'fetch/',
    CREATE_PATH: 'create/',
    UPDATE_PATH: 'update/',
    UPDATE_ALL_PATH: 'updateAll/',
    REMOVE_PATH: 'delete/',
    
    find: function(model,query,destination){
        var url = this.FIND_PATH + model.name;
        if (query != undefined && typeof query == 'object'){
            var querystring = '';
            $.each(query,function(i,n){
                querystring += '/' + i + ':' + n;
            });
            url += querystring;
        }
        Router.get(url,function(response,status){
            if (status != 'success'){
                console.log('DB.find: AJAX request failed');
                return false;
            }
            if (!response.status){
                console.log(response);
                console.log('DB.find: Server returned error');
                return false;
            }
            console.log('DB.find: Operation complete');
            DB.onFindComplete(response,model,destination);
            return true;
        });
        return true;
    },
    
    onFindComplete: function(response,model,destination){
        destination = (destination != undefined && typeof destination == 'string') ? destination : model.mainArray;
        var data = model.prepareFound(response.data);
        model.set(destination,data);
    },
    
    create: function(model,data,destination){
        Router.post(this.CREATE_PATH + model.name,{data: data},function(response,status){
            if (status != 'success'){
                console.log('DB.create: AJAX request failed');
                return false;
            }
            if (!response.status){
                console.log('DB.create: Server returned error');
                console.log(response);
                return false;
            }
            DB.onCreateComplete(response,model,destination);
            return true;
        });
    },
    
    onCreateComplete: function(response,model,destination){
        destination.id = response.data.id;
    },
    
    update: function(model,data){
        var modelName = model.name;
        Router.post(this.UPDATE_PATH + modelName,{data: data},function(response,status){
            if (status != 'success'){
                console.log('DB.update: AJAX request failed');
                return false;
            }
            if (!response.status){
                console.log('DB.update: Server returned error');
                console.log(response);
                return false;
            }
            DB.onUpdateComplete(response,model);
            return true;
        });
    },
    
    onUpdateComplete: function(response,model){
        console.log(this);
    },
    
    updateAll: function(model,data){
        Router.post(this.UPDATE_ALL_PATH + model.name,{data: data},function(response,status){
            if (status != 'success'){
                console.log('DB.updateAll: AJAX request failed');
                return false;
            }
            if (!response.status){
                console.log('DB.updateAll: Server returned error');
                console.log(response);
                return false;
            }
            DB.onUpdateAllComplete(response,model);
            return true;
        });
    },
    
    onUpdateAllComplete: function(response,model){
        console.log(response);
    },
    
    remove: function(model,id){
        Router.get(this.REMOVE_PATH + model.name + '/' + id,function(response,status){
            if (status != 'success'){
                console.log('DB.remove: AJAX request failed');
                return false;
            }
            if (!response.status){
                console.log('DB.remove: Server returned error');
                console.log(response);
                return false;
            }
            return true;
            DB.onRemoveComplete(response,modelName);
        });
    },
    
    onRemoveComplete: function(repsonse,modelName){
        for (var i in this[modelName].data){
            if (this[modelName].data[i].id = response.data.id){
                this[modelName].data.remove(i);
            }
        }
    }
};

App.Model = {
    extend: function(name,spec){
        var obj = Object.create(this);
        if (spec == undefined){
            spec = {};
        }
        spec.name = name;
        return $.extend(obj,spec);
    },
    
    mainArray: 'data',

    create: function(data,destination){
        return DB.create(this,data,destination);
    },
    
    set: function(key,value){
        if (typeof this[key] == 'function'){
            this[key](value);
        }else{
            this[key] = value;
        }
    },
    
    get: function(key){
        if (typeof this[key] == 'function'){
            return this[key]();
        }
        return this[key];
    },
    
    prepareFound: function(data){
        var that = this;
        var mappedItems = $.map(data,function(item){
            console.log(item);
            return that.record.create(item);
        });
        return mappedItems;
    },
    
    prepareToSave: function(data){
        for (var i in data){
            for (var j in data[i]){
                if (typeof data[i][j] == 'function'){
                    delete data[i][j];
                }
                if (data[i][j] === false){
                    data[i][j] = 0;
                }
            }
        }
        return data;
    },
    
    updateAll: function(data){
        //set record._destroy = 1 to delete record
        if (data == undefined){
            data = this.get(this.mainArray);
            console.log(data);
        }
        return DB.updateAll(this,data);
    },
    
    find: function(query,destination){
        return DB.find(this,query,destination);
    },
    
    remove: function(obj){
        this[this.mainArray].remove(obj);
        return DB.remove(this,obj.id);
    }
};