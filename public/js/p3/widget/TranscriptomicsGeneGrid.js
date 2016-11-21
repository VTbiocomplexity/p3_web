define([
	"dojo/_base/declare", "dojo/_base/lang", "dojo/_base/Deferred",
	"dojo/on", "dojo/dom-class", "dojo/dom-construct", "dojo/aspect", "dojo/request", "dojo/topic",
	"dijit/layout/BorderContainer", "dijit/layout/ContentPane", "./GridSelector",
	"./PageGrid", "./formatter", "../store/TranscriptomicsGeneMemoryStore"
], function(declare, lang, Deferred,
			on, domClass, domConstruct, aspect, request, Topic,
			BorderContainer, ContentPane, selector,
			Grid, formatter, Store){
	return declare([Grid], {
		region: "center",
		query: (this.query || ""),
		apiToken: window.App.authorizationToken,
		apiServer: window.App.dataServiceURL,
		store: null,
		tgState: null,
		dataModel: "genome_feature",
		primaryKey: "feature_id",
		deselectOnRefresh: true,
		columns: {
			"Selection Checkboxes": selector({unhidable: true}),
			genome_name: {label: 'Genome', field: 'genome_name'},
			patric_id: {label: 'PATRIC ID', field: 'patric_id'},
			refseq_locus_tag: {label: 'RefSeq Locus Tag', field: 'refseq_locus_tag'},
			alt_locus_tag: {label: 'Alt Locus Tag', field: 'alt_locus_tag'},
			gene: {label: 'Gene Symbol', field: 'gene'},
			product: {label: 'Product', field: 'product'},
			start: {label: 'Start', field: 'start', hidden: true},
			end: {label: 'End', field: 'end', hidden: true},
			strand: {label: 'Strand', field: 'strand', hidden: true},
			comparisons: {label: 'Comparisons', field: 'sample_size'},
			up_reg: {label: 'Up', field: 'up'},
			down_reg: {label: 'Down', field: 'down'}
		},
		constructor: function(options, parent){
			//console.log("ProteinFamiliesGrid Ctor: ", options);
			if(options && options.apiServer){
				this.apiServer = options.apiServer;
			}

			this.topicId = parent.topicId;

			Topic.subscribe("TranscriptomicsGene", lang.hitch(this, function(){
				// console.log("TranscriptomicsGeneGrid:", arguments);
				var key = arguments[0], value = arguments[1];

				switch(key){
					case "updateTgState":
						this.tgState = value;
						break;
					case "updateMainGridOrder":
						this.updateSortArrow([]);
						this.store.arrange(value);
						this.refresh();
						break;
					default:
						break;
				}
			}));
		},
		startup: function(){
			var _self = this;

			this.on("dgrid-sort", function(evt){
				_self.store.query("", {sort: evt.sort});
			});

			this.on("dgrid-select", function(evt){
				//console.log('dgrid-select: ', evt);
				var newEvt = {
					rows: evt.rows,
					selected: evt.grid.selection,
					grid: _self,
					bubbles: true,
					cancelable: true
				};
				on.emit(_self.domNode, "select", newEvt);
			});

			aspect.before(_self, 'renderArray', function(results){
				Deferred.when(results.total, function(x){
					_self.set("totalRows", x);
				});
			});

			this.inherited(arguments);
			this._started = true;
		},

		state: null,
		postCreate: function(){
			this.inherited(arguments);
		},
		_setApiServer: function(server){
			this.apiServer = server;
		},
		_setState: function(state){
			if(!this.store){
				this.set('store', this.createStore(this.apiServer, this.apiToken || window.App.authorizationToken, state));
			}else{
				this.store.set('state', state);

				this.refresh();
			}
		},
		_setSort: function(sort){
			this.inherited(arguments);
			this.store.sort = sort;

			if(sort.length > 0){
				var newIds = [];
				var idProperty = this.store.idProperty;
				this.store.query({}, {sort: sort}).forEach(function(row){
					newIds.push(row[idProperty]);
				});
				// console.log("update column order: ", newIds);
				this.tgState.clusterColumnOrder = newIds;

				Topic.publish(this.topicId, "updateTgState", this.tgState);
				Topic.publish(this.topicId, "requestHeatmapData", this.tgState);
			}
		},
		_selectAll: function(){

			this._unloadedData = {};

			return Deferred.when(this.store.data.map(function(d){
				this._unloadedData[d[this.primaryKey]] = d;
				return d[this.primaryKey];
			}, this));
		},
		createStore: function(server, token, state){

			var store = new Store({
				token: window.App.authorizationToken,
				apiServer: this.apiServer || window.App.dataServiceURL,
				topicId: this.topicId,
				state: state || this.state
			});
			store.watch('refresh', lang.hitch(this, "refresh"));

			return store;
		}
	});
});
