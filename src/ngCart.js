'use strict';


angular.module('ngCart', ['ngCart.directives'])

    .config([function () {

    }])

    .provider('$ngCart', function () {
        this.$get = function () {
        };
    })

    .run(['$rootScope', 'ngCart','ngCartItem', 'store', function ($rootScope, ngCart, ngCartItem, store) {

        $rootScope.$on('ngCart:change', function(){
            ngCart.$save();
        });

        if (angular.isObject(store.get('cart'))) {
            ngCart.$restore(store.get('cart'));

        } else {
            ngCart.init();
        }

    }])

    .service('ngCart', ['$rootScope', '$window', 'ngCartItem', 'store', function ($rootScope, $window, ngCartItem, store) {

        this.init = function(){
            this.$cart = {
                shipping : null,
                items : [],
                taxes : [],
                localId : null,
                shippingAddress : {
                    name: String,
                    phone: String,
                    street: String,
                    number: String,
                    dir1: String,
                    dir2: String,
                    postalCode: String,
                    province: String,
                    country: String
                },
                billingAddress : {
                    fiscalName: String,
                    phone: String,
                    street: String,
                    number: String,
                    dir1: String,
                    dir2: String,
                    postalCode: String,
                    province: String,
                    country: String,
                    taxNumber:  String,
                    taxType:  String
                }
            };
        };

        this.addItem = function (id, name, price, quantity, data, weight, taxPercent, taxName, unit, packageUnit, weightUnit) {

            var inCart = this.getItemById(id);

            if (typeof inCart === 'object'){
                //Update quantity of an item if it's already in the cart
                inCart.setQuantity(quantity, false);
                $rootScope.$broadcast('ngCart:itemUpdated', inCart);
            } else {
                var newItem = new ngCartItem(id, name, price, quantity, data, weight, taxPercent, taxName, unit, packageUnit, weightUnit);
                this.$cart.items.push(newItem);
                $rootScope.$broadcast('ngCart:itemAdded', newItem);
            }

            $rootScope.$broadcast('ngCart:change', {});
        };

        this.getItemById = function (itemId) {
            var items = this.getCart().items;
            var build = false;

            angular.forEach(items, function (item) {
                if  (item.getId() === itemId) {
                    build = item;
                }
            });
            return build;
        };

        this.setShipping = function(shipping){
            this.$cart.shipping = shipping;
            return this.getShipping();
        };

        this.getShipping = function(){
            if (this.getCart().items.length === 0) return 0;
            return  this.getCart().shipping;
        };

        this.setCart = function (cart) {
            this.$cart = cart;
            return this.getCart();
        };

        this.getCart = function(){
            return this.$cart;
        };

        this.setLocalId = function(localId){
            this.$cart.localId = localId;
            return this.getLocalId();
        };

        this.getLocalId = function(){
            return  this.$cart.localId;
        };

        this.setShippingAddress = function(shippingAddress){
            this.$cart.shippingAddress = shippingAddress;
            return this.getShippingAddress();
        };

        this.getShippingAddress = function(){
            return  this.$cart.shippingAddress;
        };

        this.setBillingAddress = function(billingAddress){
            this.$cart.billingAddress = billingAddress;
            return this.getBillingAddressAddress();
        };

        this.getBillingAddress = function(){
            return  this.$cart.billingAddress;
        };

        this.getItems = function(){
            return this.getCart().items;
        };

        this.getTaxes = function(){
            var taxes = [];
            angular.forEach(this.getCart().items, function (item) {
                var tax = item.getTax();
                if (tax) {
                    tax.value = +item.getTaxValue();
                    var taxFound = false;
                    if (taxes.length) {
                        angular.forEach(taxes, function (arrayTax) {
                            if ((arrayTax.name === tax.name) && (arrayTax.tax === tax.tax)) {
                                taxFound = true;

                                arrayTax.value = parseFloat(arrayTax.value + tax.value);
                            }
                        });
                        if (!taxFound) {
                            taxes.push(tax);
                        }
                    } else {
                        taxes.push(tax);
                    }
                }
            });

            return taxes;
        };

        this.getTaxesTotalValue = function(){
            var taxes = this.getTaxes();
            var total = 0;

            angular.forEach(taxes, function (tax) {
                total += tax.value;
            });

            return +parseFloat(total).toFixed(2);
        };

        this.getTotalItems = function () {
            var count = 0;
            var items = this.getItems();
            angular.forEach(items, function (item) {
                count += item.getQuantity();
            });
            return count;
        };

        this.getTotalUniqueItems = function () {
            return this.getCart().items.length;
        };

        this.getSubTotal = function(){
            var total = 0;
            angular.forEach(this.getCart().items, function (item) {
                total += item.getSubTotal();
            });
            return +parseFloat(total).toFixed(2);
        };

        this.totalCost = function () {
            return +parseFloat(this.getSubTotal() + this.getShipping() + this.getTaxesTotalValue()).toFixed(2);
        };

        this.removeItem = function (index) {
            var item = this.$cart.items.splice(index, 1)[0] || {};
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change', {});

        };

        this.removeItemById = function (id) {
            var item;
            var cart = this.getCart();
            angular.forEach(cart.items, function (item, index) {
                if(item.getId() === id) {
                    item = cart.items.splice(index, 1)[0] || {};
                }
            });
            this.setCart(cart);
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change', {});
        };

        this.empty = function () {

            $rootScope.$broadcast('ngCart:change', {});
            this.$cart.items = [];
            $window.localStorage.removeItem('cart');
        };

        this.isEmpty = function () {

            return (this.$cart.items.length > 0 ? false : true);

        };

        this.toObject = function() {

            if (this.getItems().length === 0) return false;

            var items = [];
            angular.forEach(this.getItems(), function(item){
                items.push (item.toObject());
            });

            return {
                localId: this.getLocalId(),
                shippingAddress: this.getShippingAddress(),
                billingAddress: this.getBillingAddress(),
                shipping: this.getShipping(),
                taxTotalValue: this.getTaxesTotalValue(),
                taxes: this.getTaxes(),
                subTotal: this.getSubTotal(),
                totalCost: this.totalCost(),
                items:items
            }
        };


        this.$restore = function(storedCart){
            var _self = this;
            _self.init();
            _self.$cart.shipping = storedCart.shipping;
            _self.$cart.tax = storedCart.tax;

            angular.forEach(storedCart.items, function (item) {
                _self.$cart.items.push(new ngCartItem(item._id,  item._name, item._price, item._quantity, item._data, item._weight, item._tax.tax, item._tax.name, item._unit, item._packageUnit, item._weightUnit ));
            });
            this.$save();
        };

        this.$save = function () {
            return store.set('cart', JSON.stringify(this.getCart()));
        }

    }])

    .factory('ngCartItem', ['$rootScope', '$log', function ($rootScope, $log) {

        var item = function (id, name, price, quantity, data, weight, taxPercent, taxName, unit, packageUnit, weightUnit) {
            this.setId(id);
            this.setName(name);
            this.setUnit(unit);
            this.setPrice(price);
            this.setPackageUnit(packageUnit);
            this.setQuantity(quantity);
            this.setWeight(weight);
            this.setWeightUnit(weightUnit);
            this.setTax({'name': taxName, 'tax': taxPercent});
            this.setData(data);
        };


        item.prototype.setId = function(id){
            if (id)  this._id = id;
            else {
                $log.error('An ID must be provided');
            }
        };

        item.prototype.getId = function(){
            return this._id;
        };


        item.prototype.setName = function(name){
            if (name)  this._name = name;
            else {
                $log.error('A name must be provided');
            }
        };
        item.prototype.getName = function(){
            return this._name;
        };

        item.prototype.setPrice = function(price){
            var priceFloat = parseFloat(price);
            if (priceFloat) {
                if (priceFloat <= 0) {
                    $log.error('A price must be over 0');
                } else {
                    this._price = (priceFloat);
                }
            } else {
                $log.error('A price must be provided');
            }
        };
        item.prototype.getPrice = function(){
            return this._price;
        };

        item.prototype.setQuantity = function(quantity, relative){


            var quantityInt = parseInt(quantity);
            if (quantityInt % 1 === 0){
                if (relative === true){
                    this._quantity  += quantityInt;
                } else {
                    this._quantity = quantityInt;
                }
                if (this._quantity < 1) this._quantity = 1;

            } else {
                this._quantity = 1;
                $log.info('Quantity must be an integer and was defaulted to 1');
            }


        };

        item.prototype.getQuantity = function(){
            return this._quantity;
        };

        item.prototype.setData = function(data){
            if (data) this._data = data;
        };

        item.prototype.getData = function(){
            if (this._data) return this._data;
            else $log.info('This item has no data');
        };

        item.prototype.setWeight = function(data){
            if (data) this._weight = data;
        };

        item.prototype.getWeight = function(){
            if (this._weight) return this._weight;
            else $log.info('This item has no weight');
        };

        item.prototype.setTax = function(data){
            data.tax = parseFloat(data.tax);
            data.value = +parseFloat(this.getQuantity() * this.getPrice() * data.tax).toFixed(2);
            if (data) this._tax = data;
        };

        item.prototype.getTax= function(){
            if (this._tax) return this._tax;
            else $log.info('This item has no tax');
        };

        item.prototype.getTaxValue= function(){
            if (!this._tax) $log.info('This item has no tax');
            else {
                return +parseFloat(this.getQuantity() * this.getPrice() * this._tax.tax).toFixed(2);
            }
        };

        item.prototype.getTotal = function(){
            var taxValue = parseFloat(this.getTaxValue());

            return +parseFloat(this.getQuantity() * this.getPrice() + taxValue).toFixed(2);
        };

        item.prototype.getSubTotal = function(){
            return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
        };

        item.prototype.setUnit = function(data){
            if (data) this._unit = data;
        };

        item.prototype.getUnit = function(){
            if (this._unit) return this._unit;
            else $log.info('This item has no unit');
        };

        item.prototype.setPackageUnit = function(data){
            if (data) this._packageUnit = data;
        };

        item.prototype.getPackageUnit = function(){
            if (this._packageUnit) return this._packageUnit;
            else $log.info('This item has no unit per package');
        };

        item.prototype.setWeightUnit = function(data){
            if (data) this._weightUnit = data;
        };

        item.prototype.getWeightUnit  = function(){
            if (this._weightUnit) return this._weightUnit;
            else $log.info('This item has no weight unit');
        };

        item.prototype.getTotalUnits  = function(){
            if (this._unit !== 'unitary') {
                return this._quantity;
            } else {
                return +parseFloat(this._packageUnit * this._quantity).toFixed(0);
            }
        };

        item.prototype.toObject = function() {
            return {
                id: this.getId(),
                name: this.getName(),
                price: this.getPrice(),
                quantity: this.getQuantity(),
                data: this.getData(),
                weight: this.getWeight(),
                subTotal: this.getSubTotal(),
                taxValue: this.getTaxValue(),
                tax: this.getTax(),
                total: this.getTotal(),
                unit: this.getUnit(),
                totalUnits: this.getTotalUnits(),
                weightUnit: this.getWeightUnit(),
                packageUnit: this.getPackageUnit()
            }
        };

        return item;

    }])

    .service('store', ['$window', function ($window) {

        return {

            get: function (key) {
                if ( $window.localStorage.getItem(key) )  {
                    var cart = angular.fromJson( $window.localStorage.getItem(key) ) ;
                    return JSON.parse(cart);
                }
                return false;

            },


            set: function (key, val) {

                if (val === undefined) {
                    $window.localStorage.removeItem(key);
                } else {
                    $window.localStorage.setItem( key, angular.toJson(val) );
                }
                return $window.localStorage.getItem(key);
            }
        }
    }])

    .controller('CartController',['$scope', 'ngCart', function($scope, ngCart) {
        $scope.ngCart = ngCart;

    }])

    .value('version', '1.0.0');
