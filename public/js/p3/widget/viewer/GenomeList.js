define([
	"dojo/_base/declare", "dijit/layout/ContentPane", "./_GenomeList"
], function(declare, ContentPane, GenomeList){
	return declare([GenomeList], {
		onSetQuery: function(attr, oldVal, newVal){
			// prevent default action
		},
		createOverviewPanel: function(){
			return new ContentPane({
				content: "Genome List Overview",
				title: "Overview",
				id: this.viewer.id + "_" + "overview"
			})
		}
	});
});
