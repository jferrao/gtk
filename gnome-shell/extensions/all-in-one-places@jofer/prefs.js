const Gtk = imports.gi.Gtk;
//const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;
//const options = Extension.imports.menu_items;



const SCHEMA = "org.gnome.shell.extensions.AllInOnePlaces";

const SETTINGS = Lib.getSettings(Extension, SCHEMA);;

const PANEL_WIDGETS = [
    {'type': 'switch', 'args': { 'key': 'left-panel-menu', 'label': _("Show icon on the left side of the panel") }},
    {'type': 'switch', 'args': { 'key': 'show-panel-icon', 'label': _("Show panel icon") }},
    {'type': 'slider', 'args': { 'key': 'panel-icon-size', 'label': _("Panel icon size"), 'min': 8, 'max': 46, 'step': 1, 'default': 14 }},
    {'type': 'switch', 'args': { 'key': 'show-panel-text', 'label': _("Show text in panel") }},
    {'type': 'entry', 'args': { 'key': 'panel-text', 'label': _("Panel text") }},
    {'type': 'combo', 'args': { 'key': 'file-manager', 'label': _("File manager"), 'values': {'nautilus': 'Nautilus', 'thunar': 'Thunar', 'pcmanfm': 'PCManFM'} }},
    {'type': 'entry', 'args': { 'key': 'connect-command', 'label': _("Application for the  \"Connect to...\" item") }},
    {'type': 'entry', 'args': { 'key': 'search-command', 'label': _("Application for the \"Search\" item") }}
]

let MENU_WIDGETS = [
    {'type': 'switch', 'args': { 'key': 'show-desktop-item', 'label': _("Show desktop item") }},
    {'type': 'switch', 'args': { 'key': 'show-trash-item', 'label': _("Show trash item") }},
    {'type': 'switch', 'args': { 'key': 'hide-empty-trash-item', 'label': _("Hide empty trash item") }},
    {'type': 'switch', 'args': { 'key': 'show-bookmarks-section', 'label': _("Show bookmarks section") }},
    {'type': 'switch', 'args': { 'key': 'collapse-bookmarks-section', 'label': _("Drop-down style bookmarks section") }},
    {'type': 'switch', 'args': { 'key': 'show-filesystem-item', 'label': _("Show file system item") }},
    {'type': 'switch', 'args': { 'key': 'show-devices-section', 'label': _("Show devices section") }},
    {'type': 'switch', 'args': { 'key': 'collapse-devices-section', 'label': _("Drop-down style devices section") }},
    {'type': 'switch', 'args': { 'key': 'show-network-section', 'label': _("Show network section") }},
    {'type': 'switch', 'args': { 'key': 'collapse-network-section', 'label': _("Drop-down style network section") }},
    {'type': 'switch', 'args': { 'key': 'show-search-item', 'label': _("Show search item") }},
    {'type': 'switch', 'args': { 'key': 'show-documents-section', 'label': _("Show recent documents section") }},
    {'type': 'slider', 'args': { 'key': 'max-documents-documents', 'label': _("Maximum number of recent documents"), 'min': 5, 'max': 25, 'step': 1, 'default': 10 }},
    {'type': 'slider', 'args': { 'key': 'item-icon-size', 'label': _("Menu item icon size"), 'min': 8, 'max': 46, 'step': 1, 'default': 22 }},
]



function init() {}

function buildPrefsWidget()
{
    let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10, spacing: 10 });
    
    // Global tab
    let box_panel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
    for (i in PANEL_WIDGETS) {
        let widget_method = PANEL_WIDGETS[i]['type'];
        let widget = new widgets()[widget_method](PANEL_WIDGETS[i]['args']);
        box_panel.pack_start(widget, false, false, 5);
    }

    // Items tab
    let box_items = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
    for (i in MENU_WIDGETS) {
        let widget_method = MENU_WIDGETS[i]['type'];
        let widget = new widgets()[widget_method](MENU_WIDGETS[i]['args']);
        box_items.pack_start(widget, false, false, 5);
    }

    // Build tabs
    let tabs = new Gtk.Notebook();
    tabs.set_scrollable(true);
    tabs.set_size_request(100, 100);
    tabs.append_page(box_panel, new Gtk.Label({ label: "Global" }));
    tabs.append_page(box_items, new Gtk.Label({ label: "Menu items" }));
    frame.pack_start(tabs, false, false, 0);

    // Buttons box
    let box_buttons = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, border_width: 0 });

    let button_default = new Gtk.Button({ label: "Restore default values" });
    let button_image = new Gtk.Image();
    button_image.set_from_stock(Gtk.STOCK_REFRESH, 3);
    button_default.set_image(button_image);
    //button_default.connect('clicked', restoreDefaultValues());
    box_buttons.pack_end(button_default, false, false, 0);
    
    frame.pack_end(box_buttons, false, false, 0);

    frame.show_all();
    return frame;
}



function widgets() {}

widgets.prototype = {

    switch: function(args)
    {
        if (Object.keys(args).length != 2 || (args['key'] == undefined || args['label'] == undefined)) {
            throw new Error("Incorrect arguments in widgets().switch() method: needs key and label.");
        }
        
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: args['label'], xalign: 0 });
        let widget = new Gtk.Switch({ active: SETTINGS.get_boolean(args['key']) });
        widget.connect('notify::active', function(switch_widget) {
            SETTINGS.set_boolean(args['key'], switch_widget.active);
        });
/*
        if (settings_bool[setting].help) {
            label.set_tooltip_text(settings_bool[setting].help);
            widget.set_tooltip_text(settings_bool[setting].help);
        }
*/
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    },
    
    entry: function(args)
    {
        if (Object.keys(args).length != 2 || (args['key'] == undefined || args['label'] == undefined)) {
            throw new Error("Incorrect arguments in widgets().entry() method: needs key and label.");
        }
        
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: args['label'], xalign: 0 });
        let widget = new Gtk.Entry({ hexpand: true });
        widget.set_text(SETTINGS.get_string(args['key']));
        widget.connect('changed', function(entry_widget) {
            SETTINGS.set_string(args['key'], entry_widget.get_text());
        });
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    },
    
    slider: function(args)
    {
        if (Object.keys(args).length != 6 || (args['key'] == undefined || args['label'] == undefined || args['min'] == undefined || args['max'] == undefined || args['step'] == undefined || args['default'] == undefined)) {
            throw new Error("Incorrect arguments in widgets().slider() method: needs key, label, min, max, step, default.");
        }
        
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: args['label'], xalign: 0 });
        let widget = new Gtk.HScale.new_with_range(args['min'], args['max'], args['step']);
        widget.set_value(SETTINGS.get_int(args['key']));
        //widget.add_mark(args['default'], Gtk.PositionType.BOTTOM, String(args['default']));  
        widget.set_size_request(200, -1);
        widget.connect('value_changed', function(slider_widget) {
            SETTINGS.set_int(args['key'], slider_widget.get_value());
        });
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    },
    
    combo: function(args)
    {
        if (Object.keys(args).length != 3 || (args['key'] == undefined || args['label'] == undefined || args['values'] == undefined)) {
            throw new Error("Incorrect arguments in widgets().entry() method: needs key, label and values.");
        }
        
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: args['label'], xalign: 0 });
        let widget = new Gtk.ComboBoxText();
        for (command in args['values']) {
            widget.append(command, args['values'][command]);
        }
        widget.set_active_id(SETTINGS.get_string(args['key']));
        widget.connect('changed', function(combo_widget) {
            SETTINGS.set_string(args['key'], combo_widget.get_active_id());
        });
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    }

}
