const Gtk = imports.gi.Gtk;
//const GObject = imports.gi.GObject;
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
    
    // Global tab
    let box_panel = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

    let switch_left_panel = new widgets().switch('left-panel-menu', "Show icon in left side of panel");
    box_panel.pack_start(switch_left_panel, false, false, 5);
    
    let switch_panel_icon = new widgets().switch('show-panel-icon', "Show panel icon");
    box_panel.pack_start(switch_panel_icon, false, false, 5);

    let slider_panel_icon = new widgets().slider('panel-icon-size', "Panel icon size", 8, 46, 1, 14);
    box_panel.add(slider_panel_icon);

    let switch_panel_text = new widgets().switch('show-panel-text', "Show panel text");
    box_panel.pack_start(switch_panel_text, false, false, 5);

    let entry_panel_text = new widgets().entry('panel-text', "Panel text");
    box_panel.pack_start(entry_panel_text, false, false, 5);

	box_panel.pack_start(new Gtk.HSeparator(), false, false, 10)
    
    let select_file_manager = new widgets().combo('file-manager', "File manager", {'nautilus': 'Nautilus', 'thunar': 'Thunar', 'pcmanfm': 'PCManFM'});
    box_panel.pack_start(select_file_manager, false, false, 5);
    
    let entry_connect_command = new widgets().entry('connect-command', "Application for the  \"Connect to...\" item");
    box_panel.pack_start(entry_connect_command, false, false, 5);
    
    let entry_search_command = new widgets().entry('search-command', "Application for the \"Search\" item");
    box_panel.pack_start(entry_search_command, false, false, 5);

	// Buttons box
    let box_buttons = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, border_width: 0 });

	let button_default = new Gtk.Button({ label: "Restore default values" });
	let button_image = new Gtk.Image();
	button_image.set_from_stock(Gtk.STOCK_REFRESH, 3);
	button_default.set_image(button_image);
    //button_default.connect('clicked', restoreDefaultValues());
    box_buttons.pack_end(button_default, false, false, 0);
    
    box_panel.pack_end(box_buttons, false, false, 0);

	// Items tab
    let box_items = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

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

    let slider_max_documents = new widgets().slider('max-documents-documents', "Maximum number of recent documents", 5, 25, 1, 10);
    box_items.add(slider_max_documents);
    
    let slider_icon_size = new widgets().slider('item-icon-size', "Menu item icon size", 8, 46, 1, 22);
    box_items.add(slider_icon_size);

	let box_commands = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
	
	let tabs = new Gtk.Notebook();
	tabs.set_scrollable(true);
	tabs.set_size_request(100, 100);
	tabs.append_page(box_panel, new Gtk.Label({ label: "Global" }));
	tabs.append_page(box_items, new Gtk.Label({ label: "Menu items" }));
	
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
    
    slider: function(key, label_text, min, max, step, def)
    {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: label_text, xalign: 0 });
        let widget = new Gtk.HScale.new_with_range(min, max, step);
        widget.set_value(options.get_int(key));
        widget.add_mark(def, Gtk.PositionType.BOTTOM, String(def));  
        widget.add_mark(min, Gtk.PositionType.BOTTOM, String(min));  
        widget.add_mark(max, Gtk.PositionType.BOTTOM, String(max));  
        widget.set_size_request(200, -1);
        widget.connect('value_changed', function(slider_widget) {
            options.set_int(key, slider_widget.get_value());
        });

        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
    },
    
    combo: function(key, label_text, values)
    {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        let label = new Gtk.Label({ label: label_text, xalign: 0 });

        let widget = new Gtk.ComboBoxText();
        for (command in values) {
			widget.append(command, values[command]);
		}
		
		widget.set_active_id(options.get_string(key));
		widget.connect('changed', function(combo_widget) {
            options.set_string(key, combo_widget.get_active_id());
        });
		
        box.pack_start(label, true, true, 0);
        box.add(widget);
        return box;
	}
    
}
