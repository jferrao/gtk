const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;
//const options = Extension.imports.menu_items;

const schema = "org.gnome.shell.extensions.AllInOnePlaces";



let options;



function init()
{
    options = Lib.getSettings(Extension, schema);
}

function buildPrefsWidget()
{
  
  
    let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
    
    let box_panel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

    let switch_left_panel = new widgets().switch('left-panel-menu', "Show icon in left side of panel");
    box_panel.pack_start(switch_left_panel, false, false, 5);
    
    let switch_panel_icon = new widgets().switch('show-panel-icon', "Show panel icon");
    box_panel.pack_start(switch_panel_icon, false, false, 5);

    let slider_panel_icon = new widgets().slider('panel-icon-size', "Panel icon size", 8, 46, 1);
    box_panel.add(slider_panel_icon);

    let switch_panel_text = new widgets().switch('show-panel-text', "Show panel text");
    box_panel.pack_start(switch_panel_text, false, false, 5);

    let entry_panel_text = new widgets().entry('panel-text', "Panel text");
    box_panel.pack_start(entry_panel_text, false, false, 5);

    let box_items = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

    let slider_icon_size = new widgets().slider('item-icon-size', "Menu item icon size", 8, 46, 1);
    box_items.add(slider_icon_size);
    
    let switch_desktop_item = new widgets().switch('show-desktop-item', "Show desktop item");
    box_items.pack_start(switch_desktop_item, false, false, 5);

    let switch_trash_item = new widgets().switch('show-trash-item', "Show trash item");
    box_items.pack_start(switch_trash_item, false, false, 5);

    let switch_hide_trash = new widgets().switch('hide-empty-trash-item', "Hide empty trash item");
    box_items.pack_start(switch_hide_trash, false, false, 5);

    let switch_bookmarks_section = new widgets().switch('show-bookmarks-section', "Show bookmarks section");
    box_items.pack_start(switch_bookmarks_section, false, false, 5);

    let switch_collapse_bookmarks = new widgets().switch('collapse-bookmarks-section', "Drop-down style bookmarks section");
    box_items.pack_start(switch_collapse_bookmarks, false, false, 5);

    let switch_fs_item = new widgets().switch('show-filesystem-item', "Show file system item");
    box_items.pack_start(switch_fs_item, false, false, 5);

    let switch_devices_section = new widgets().switch('show-devices-section', "Show devices section");
    box_items.pack_start(switch_devices_section, false, false, 5);

    let switch_collapse_devices = new widgets().switch('collapse-devices-section', "Drop-down style devices section");
    box_items.pack_start(switch_collapse_devices, false, false, 5);

    let switch_network_section = new widgets().switch('show-network-section', "Show network section");
    box_items.pack_start(switch_network_section, false, false, 5);

    let switch_collapse_network = new widgets().switch('collapse-network-section', "Drop-down style network section");
    box_items.pack_start(switch_collapse_network, false, false, 5);

    let switch_search_item = new widgets().switch('show-search-item', "Show search item");
    box_items.pack_start(switch_search_item, false, false, 5);

    let switch_documents_section = new widgets().switch('show-documents-section', "Show recent documents section");
    box_items.pack_start(switch_documents_section, false, false, 5);

    let slider_max_documents = new widgets().slider('max-documents-documents', "Maximum number of recent documents", 5, 25, 1);
    box_items.add(slider_max_documents);

	let box_commands = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
	
	let tabs = new Gtk.Notebook();
	tabs.set_scrollable(true);
	tabs.set_size_request(100, 100);
	tabs.append_page(box_panel, new Gtk.Label({ label: "Panel" }));
	tabs.append_page(box_items, new Gtk.Label({ label: "Menu items" }));
	tabs.append_page(box_commands, new Gtk.Label({ label: "Launchers" }));
	
	frame.pack_start(tabs, false, false, 0);
	
    frame.show_all();
    return frame;
}



function widgets() {}

widgets.prototype = {

    switch: function(key, label_text)
    {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: label_text, xalign: 0 });
        let widget = new Gtk.Switch({ active: options.get_boolean(key) });
        widget.connect('notify::active', function(switch_widget) {
            options.set_boolean(key, switch_widget.active);
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
    
    entry: function(key, label_text)
    {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: label_text, xalign: 0 });
        let widget = new Gtk.Entry({ hexpand: true });
        widget.set_text(options.get_string(key));
        widget.connect('changed', function(entry_widget) {
            options.set_string(key, entry_widget.get_text());
        });

        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    },
    
    slider: function(key, label_text, min, max, step)
    {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: label_text, xalign: 0 });
        let widget = new Gtk.HScale.new_with_range(min, max, step);
        widget.set_value(options.get_int(key));
        //widget.add_mark(10, Gtk.PositionType.BOTTOM, null);  
        widget.set_size_request(200, -1);
        widget.connect('value_changed', function(slider_widget) {
            options.set_int(key, slider_widget.get_value());
        });
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    }
    
}
