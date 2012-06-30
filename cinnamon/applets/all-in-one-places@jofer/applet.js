/**
 * All-in-one Places applet for Cinnamon.
 * http://jferrao.github.com/gtk
 * 
 * 
 * @author jferrao <jferrao@ymail.com>
 * @version 1.3.1
 * 
 */





/**
 * Import stuff ...
 */
const Applet = imports.ui.applet;
const Cinnamon = imports.gi.Cinnamon;

const GLib = imports.gi.GLib;
const Lang = imports.lang;
const St = imports.gi.St;
const ModalDialog = imports.ui.modalDialog;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext;
const _ = Gettext.gettext;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const FileUtils = imports.misc.fileUtils;

const EXTENSION_UUID = "all-in-one-places@jofer"
const SCHEMA_NAME = "org.cinnamon.applets.AllInOnePlaces";
const APPLET_DIR = imports.ui.appletManager.appletMeta["all-in-one-places@jofer"].path;



let settings;










/**
 * Global to store configuration values.
 */
let config;

/**
 * Default configuration options in case something goes wrong with the config.json file.
 */
const DEFAULT_CONFIG = {
    "SHOW_PANEL_ICON": true,
    "USE_FULL_COLOR_ICON": false,
    "SHOW_PANEL_TEXT": false,
    "PANEL_TEXT": null,
    "SHOW_DESKTOP": true,
    "AUTO_HIDE_TRASH": false,
    "SHOW_BOOKMARKS": true,
    "COLLAPSE_BOOKMARKS": false,
    "SHOW_FILE_SYSTEM": false,
    "SHOW_DEVICES": true,
    "COLLAPSE_DEVICES": false,
    "SHOW_NETWORK": true,
    "COLLAPSE_NETWORK": false,
    "SHOW_SEARCH": true,
    "SHOW_RECENT_DOCUMENTS": true,
    "ICON_SIZE": 22,
    "RECENT_ITEMS": 10
};

const CONFIG_FILE    = 'applets/all-in-one-places@jofer/config.json';










/**
 * Messages for the confirmation dialog boxes.
 */
const EMPTY_TRASH_LABEL     = _("Empty Trash");
const EMPTY_TRASH_MESSAGE   = _("Are you sure you want to delete all items from the trash?") + "\n" + _("This operation cannot be undone.") + "\n";
const EJECT_DEVICE_LABEL    = _("Eject");
const EJECT_DEVICE_MESSAGE  = _("Are you sure you want to eject this device ?") + "\n";
const CLEAR_RECENT_LABEL    = _("Recent documents");
const CLEAR_RECENT_MESSAGE  = _("Clear the Recent Documents list?") + "\n";





/**
 * Default menu item
 */
function MenuItem()
{
    this._init.apply(this, arguments);
}

MenuItem.prototype =
{
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,
    
    _init: function(icon, text, params)
    {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);
            
        let box = new St.BoxLayout({ style_class: 'popup-combobox-item' });
        box.add(icon);
        let label = new St.Label({ text: text });
        box.add(label);
        this.addActor(box);
    }
};

/**
 * Device menu item with eject button
 */
function DeviceMenuItem()
{
    this._init.apply(this, arguments);
}

DeviceMenuItem.prototype =
{
    __proto__: MenuItem.prototype,
    
    _init: function(device, icon, text, params)
    {
        MenuItem.prototype._init.call(this, icon, text, params);
        this.device = device;
        this._addEjectButton();
    },
    
    _addEjectButton: function()
    {
        let eject_icon = new St.Icon({ icon_name: 'media-eject', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon ' });
        let eject_button = new St.Button({ child: eject_icon });
        eject_button.connect('clicked', Lang.bind(this, this._confirmEjectDevice));
        this.addActor(eject_button);
    },
        
    _confirmEjectDevice: function()
    {
        new ConfirmationDialog(Lang.bind(this, this._doEjectDevice), EJECT_DEVICE_LABEL, EJECT_DEVICE_MESSAGE, _("Cancel"), _("OK")).open();
    },
    
    _doEjectDevice: function()
    {
        this.device.remove();
    },
    
    activate: function(event)
    {
        this.device.launch({ timestamp: event.get_time() });
        PopupMenu.PopupBaseMenuItem.prototype.activate.call(this, event);
    }
};

/**
 * Trash menu item with empty trash button
 */
function TrashMenuItem()
{
    this._init.apply(this, arguments);
}

TrashMenuItem.prototype =
{
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,
    
    _init: function(text, params)
    {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

        let trash_path = "trash:///";
        this.trash_file = Gio.file_new_for_uri(trash_path);

        this.text = text;

        this._checkTrashStatus();

        this.monitor = this.trash_file.monitor_directory(0, null, null);
        this._trashChanged = this.monitor.connect('changed', Lang.bind(this, this._checkTrashStatus));
    },

    destroy: function()
    {
        this.monitor.disconnect(this._trashChanged);
        this.actor.destroy();
        //this.parent();
    },

    _showTrashItem: function(icon)
    {
        this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });        
        this.box.add(icon);
        let label = new St.Label({ text: this.text });
        this.box.add(label);
        this.addActor(this.box);
    },
    
    _showTrashItemEmpty: function()
    {
        let icon = new St.Icon({icon_name: "trashcan_empty", icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        this._showTrashItem(icon);
    },
    
    _showTrashItemFull: function()
    {
        let icon = new St.Icon({icon_name: "trashcan_full", icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        this._showTrashItem(icon);
        
        let empty_icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon ' });
        this.empty_button = new St.Button({ child: empty_icon, tooltip_text: _("Empty Trash")  });
        this.empty_button.connect('clicked', Lang.bind(this, this._confirmEmptyTrash));
        this.addActor(this.empty_button);
    },
    
    _clearTrashItem: function()
    {
        if (this.box) this.removeActor(this.box);
        if (this.empty_button) this.removeActor(this.empty_button);
    },
    
    _checkTrashStatus: function()
    {
        let children = this.trash_file.enumerate_children('*', 0, null, null);
        if (children.next_file(null, null) == null) {
            this._clearTrashItem();
            this._showTrashItemEmpty();
            if (config.AUTO_HIDE_TRASH) {
                this.actor.visible = false;
            }
        } else {
            this._clearTrashItem();
            this._showTrashItemFull();
            if (config.AUTO_HIDE_TRASH) {
                this.actor.show();
                this.actor.visible = true;
            }
        }
    },
    
    _confirmEmptyTrash: function()
    {
        new ConfirmationDialog(Lang.bind(this, this._doEmptyTrash), EMPTY_TRASH_LABEL, EMPTY_TRASH_MESSAGE, _("Cancel"), _("Empty Trash")).open();
    },

    _doEmptyTrash: function()
    {
        let children = this.trash_file.enumerate_children('*', 0, null, null);
        let child_info = null;
        while ((child_info = children.next_file(null, null)) != null) {
            let child = this.trash_file.get_child(child_info.get_name());
            child.delete(null);
        }
    },
    
    activate: function(event)
    {
        new launch().file(this.trash_file.get_uri());
        PopupMenu.PopupBaseMenuItem.prototype.activate.call(this, event);
    }

};



/**
 * Modal confirmation dialog box
 */
function ConfirmationDialog()
{
    this._init.apply(this, arguments);
}

ConfirmationDialog.prototype =
{
    __proto__: ModalDialog.ModalDialog.prototype,

    _init: function(callback, label, message, cancel_button_label, callback_button_layer)
    {
        ModalDialog.ModalDialog.prototype._init.call(this, { styleClass: null });

        let mainContentBox = new St.BoxLayout({ style_class: 'polkit-dialog-main-layout', vertical: false });
        this.contentLayout.add(mainContentBox, { x_fill: true, y_fill: true });

        let messageBox = new St.BoxLayout({ style_class: 'polkit-dialog-message-layout', vertical: true });
        mainContentBox.add(messageBox, { y_align: St.Align.START });

        this._subjectLabel = new St.Label({ style_class: 'polkit-dialog-headline', text: label });
        messageBox.add(this._subjectLabel, { y_fill: false, y_align: St.Align.START });

        this._descriptionLabel = new St.Label({ style_class: 'polkit-dialog-description', text: message });
        messageBox.add(this._descriptionLabel, { y_fill: true, y_align: St.Align.START });
        
        this.setButtons([
            {
                label: cancel_button_label,
                action: Lang.bind(this, function() {
                    this.close();
                }),
                key: Clutter.Escape
            },
            {
                label: callback_button_layer,
                action: Lang.bind(this, function() {
                    this.close();
                    callback();
                })
            }
        ]);
    }
};



/**
 * The applet itself
 */
function MyApplet(orientation)
{
    this._init(orientation);
}

MyApplet.prototype =
{
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation)
    {
        Applet.TextIconApplet.prototype._init.call(this, orientation);

        this.getConfig();

        try {
            // Monitor settings changes and refresh menu on change
            this._settingsChanged = settings.connect('changed', Lang.bind(this, this._displayOnPanel));
            this._displayOnPanel();

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menuManager.addMenu(this.menu);

            // Add edit settings context menu item
            let settings_menu_item = new Applet.MenuItem(_("Settings"), Gtk.STOCK_EDIT, Lang.bind(this, this._launchSettings));
            this._applet_context_menu.addMenuItem(settings_menu_item);

            this._displayMenu();
        }
        catch (e) {
            global.logError(e);
        };
    },

    on_applet_clicked: function(event)
    {
        this.menu.toggle();        
    },
    
    _displayOnPanel: function()
    {
        let show_panel_icon;
        
        // Do not allow both icon and text to be false
        if (!settings.get_boolean('show-panel-icon') && !settings.get_boolean('show-panel-text')) {
            show_panel_icon = true;
        } else {
            show_panel_icon = settings.get_boolean('show-panel-icon');
        }
        
        /*
        // Clean up all actor's children
        this.actor.get_children().forEach(function(c) {
            c.destroy()
        });
        */

        if (show_panel_icon) {
            if (settings.get_boolean('full-color-panel-icon')) {
                this.set_applet_icon_name('user-home');
            } else {
                this.set_applet_icon_symbolic_name('folder');
            }
        }

        if (settings.get_boolean('show-panel-text')) {
            let text = (config.PANEL_TEXT) ? config.PANEL_TEXT : _("Places");
            if (show_panel_icon) {
                this.set_applet_label(" " + text);
            } else {
                this.set_applet_label(text);
            }
        } else {
            this.set_applet_tooltip(_("Places"));
        }
    },

    _displayMenu : function()
    {
        // Clean up all menu items
        this.menu.removeAll();

        // Show home item
        this.menu.addMenuItem(this._createStandardItem('user-home', _("Home Folder"), settings.get_string('file-manager')));

        // Show desktop item
        if (settings.get_boolean('show-desktop-item')) {
            //let desktop_folder = FileUtils.getUserDesktopDir()
            let desktop_folder = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
            this.menu.addMenuItem(this._createStandardItem('user-desktop', _("Desktop"), settings.get_string('file-manager') + " \"" + desktop_folder.replace(" ","\ ") + "\""));
        }

        // Show trash item
        if (settings.get_boolean('show-trash-item')) {
            this.menu.addMenuItem(new TrashMenuItem(_("Trash")));
        }

        // Show bookmarks section
        if (settings.get_boolean('show-bookmarks-section')) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            if (settings.get_boolean('collapse-bookmarks-section')) {
                this._bookmarks_section = new PopupMenu.PopupSubMenuMenuItem(_("Bookmarks"));
            } else {
                this._bookmarks_section = new PopupMenu.PopupMenuSection();
            }
            // Monitor bookmarks changes
            this._bookmarksChanged = Main.placesManager.connect('bookmarks-updated', Lang.bind(this, this._refreshBookmarks));

            this._createBookmarksSection();
            this.menu.addMenuItem(this._bookmarks_section);
        }
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        // Show computer item
        this.menu.addMenuItem(this._createStandardItem('computer', _("Computer"), settings.get_string('file-manager') + " computer:///"));

        // Show file system item
        if (settings.get_boolean('show-filesystem-item')) {
            this.menu.addMenuItem(this._createStandardItem('drive-harddisk', _("File System"), settings.get_string('file-manager') + " /"));
        }

        // Show devices section
        if (settings.get_boolean('show-devices-section')) {
            if (settings.get_boolean('collapse-devices-section')) {
                this._devices_section = new PopupMenu.PopupSubMenuMenuItem(_("Removable Devices"));
            } else {
                this._devices_section = new PopupMenu.PopupMenuSection();
            }
            // Monitor mounts changes
            this._devicesChanged = Main.placesManager.connect('mounts-updated', Lang.bind(this, this._refreshDevices));
            
            this._createDevicesSection();
            this.menu.addMenuItem(this._devices_section);
        }












        // Show devices section
        if (config.SHOW_DEVICES) {
            if (config.COLLAPSE_DEVICES) {
                this._devicesSection = new PopupMenu.PopupSubMenuMenuItem(_("Removable Devices"));
                this.menu.addMenuItem(this._devicesSection);
                this._createDevices();
            } else {
                this._devicesSection = new PopupMenu.PopupMenuSection();
                this._createDevices();
                this.menu.addMenuItem(this._devicesSection);
            }
            
            // Monitor mounts changes
            this._devicesConn = Main.placesManager.connect('mounts-updated', Lang.bind(this, this._redisplayDevices));
        }

        // Show network section
        if (config.SHOW_NETWORK) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            if (config.COLLAPSE_NETWORK) {
                this._networkSection = new PopupMenu.PopupSubMenuMenuItem(_("Network"));
                this.menu.addMenuItem(this._networkSection);
                this._createNetwork();
            } else {
                this._networkSection = new PopupMenu.PopupMenuSection();
                this._createNetwork();
                this.menu.addMenuItem(this._networkSection);
            }
        }

        if (config.SHOW_SEARCH || config.SHOW_RECENT_DOCUMENTS) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Show search section
            if (config.SHOW_SEARCH) {
                this._createSearch();
            }

            // Show recent documents section
            if (config.SHOW_RECENT_DOCUMENTS) {
                this.RecentManager = new Gtk.RecentManager();

                this._recentSection = new PopupMenu.PopupSubMenuMenuItem(_("Recent documents"));
                this.menu.addMenuItem(this._recentSection);
                this._createRecent();
            
                // Monitor recent documents changes
                this._recentConn = this.RecentManager.connect('changed', Lang.bind(this, this._redisplayRecent));
            }
        }
        
    },

    destroy: function()
    {
        // Disconnecting signals
        if (this._bookmarksConn) Main.placesManager.disconnect(this._bookmarksConn);
        if (this._devicesConn) Main.placesManager.disconnect(this._devicesConn);
        if (this._recentConn) this.RecentManager.disconnect(this._recentConn);

        this.parent();
    },

    /**
     * Create a standard item on the main menu
     */ 
    _createStandardItem: function(icon, label, launcher)
    {
        let icon = new St.Icon({ icon_name: icon, icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR });
        let item = new MenuItem(icon, label);
        if (launcher != undefined) {
            item.connect('activate', function(actor, event) {
                new launch().command(launcher);
            });
        }
        return item;
    },

    /**
     * Build bookmarks section
     */
    _createBookmarksSection: function()
    {
        this.bookmarks = Main.placesManager.getBookmarks();

        for (let bookmarkid = 0; bookmarkid < this.bookmarks.length; bookmarkid++) {
            let icon = this.bookmarks[bookmarkid].iconFactory(settings.get_int('item-icon-size'));
            let bookmark_item = new MenuItem(icon, this.bookmarks[bookmarkid].name);
            bookmark_item.place = this.bookmarks[bookmarkid];
            
            bookmark_item.connect('activate', function(actor, event) {
                actor.place.launch();
            });
            if (this._bookmarks_section.menu) { this._bookmarks_section.menu.addMenuItem(bookmark_item) } else { this._bookmarks_section.addMenuItem(bookmark_item) }
        }
    },
    
    _refreshBookmarks: function()
    {
        if (this._bookmarks_section.menu) { this._bookmarks_section.menu.removeAll() } else { this._bookmarks_section.removeAll() }
        this._createBookmarksSection();
    },
    
    /**
     * Build devices section
     */
    _createDevices : function()
    {
        this.devices = Main.placesManager.getMounts();
        
        sectionMenu = (this._devicesSection.menu) ? this._devicesSection.menu : this._devicesSection;

        for (let devid = 0; devid < this.devices.length; devid++) {
            let icon = this.devices[devid].iconFactory(config.ICON_SIZE);
            let deviceItem = new DeviceMenuItem(this.devices[devid], icon, this.devices[devid].name);
            sectionMenu.addMenuItem(deviceItem);
        }

        if (this.devices.length == 0) {
            this._devicesSection.actor.hide();
        } else {
            this._devicesSection.actor.show();
        }
    },

    _clearDevices : function()
    {
        sectionMenu = (this._devicesSection.menu) ? this._devicesSection.menu : this._devicesSection;
        sectionMenu.removeAll();
    },

    _redisplayDevices: function()
    {
        this._clearDevices();
        this._createDevices();
    },

    /**
     * Build network section
     */
    _createNetwork: function()
    {
        sectionMenu = (this._networkSection.menu) ? this._networkSection.menu : this._networkSection;
        
        let icon = new St.Icon({icon_name: 'network-workgroup', icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        this.networkItem = new MenuItem(icon, _("Network"));
        this.networkItem.connect('activate', function(actor, event) {
            new launch().command("nautilus network:///");
        });
        sectionMenu.addMenuItem(this.networkItem);
        
        let icon = new St.Icon({icon_name: 'gnome-globe', icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        this.connectItem = new MenuItem(icon, _("Connect to..."));
        this.connectItem.connect('activate', function(actor, event) {
            new launch().command("nautilus-connect-server");
        });        
        sectionMenu.addMenuItem(this.connectItem);
    },


    /**
     * Build search section
     */
    _createSearch: function()
    {
        let icon = new St.Icon({icon_name: 'search', icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        this.searchItem = new MenuItem(icon, _("Search"));
        this.menu.addMenuItem(this.searchItem);

        this.searchItem.connect('activate', function(actor, event) {
            new launch().command("gnome-search-tool");
        });
    },

    /**
     * Build recent documents section
     */
    _createRecent: function()
    {
        let id = 0;

        if (this.RecentManager.size > 0) {
            let items = this.RecentManager.get_items();
            while (id < config.RECENT_ITEMS && id < this.RecentManager.size) {
                let icon =  new St.Icon({icon_name: items[id].get_mime_type().replace("\/","-"), icon_size: config.ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
                let recentItem = new MenuItem(icon, items[id].get_display_name());
                this._recentSection.menu.addMenuItem(recentItem);

                recentItem.connect('activate', Lang.bind(this, this._openRecentFile, items[id].get_uri()));
                id++;
            }

            this._recentSection.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            menuItem = new PopupMenu.PopupBaseMenuItem();
            let label = new St.Label({ text: _("Clear list") });
            menuItem.addActor(label, { align: St.Align.END });
            let icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon' });
            menuItem.addActor(icon, { align: St.Align.MIDDLE });
            menuItem.connect('activate', Lang.bind(this, this._clearRecent));
            this._recentSection.menu.addMenuItem(menuItem);
        }

        if (this.RecentManager.size == 0) {
            this._recentSection.actor.hide();
        } else {
            this._recentSection.actor.show();
        }
    },

    _clearRecent: function()
    {
        new ConfirmationDialog(Lang.bind(this, this._doClearRecent), CLEAR_RECENT_LABEL, CLEAR_RECENT_MESSAGE, _("Cancel"), _("Clear")).open();
    },

    _doClearRecent: function()
    {
        this.RecentManager.purge_items();
    },

    _redisplayRecent: function()
    {
        this._recentSection.menu.removeAll();
        if (this.RecentManager.size == 0) {
            this._recentSection.actor.visible = false;
        } else {
            this._recentSection.actor.show();
            this._recentSection.actor.visible = true;
            this._createRecent();
        }
    },

    _openRecentFile: function(a, b, c)
    {
        new launch().file(c);
    },
    
    _launchSettings: function()
    {
        let settingsFile = GLib.build_filenamev([global.userdatadir, "applets/all-in-one-places@jofer/settings.py"]); 
        new launch().command("python " + settingsFile);
    },
    
    /**
     * Get configuration values from config.json file. 
     */
    getConfig: function()
    {
        let configFile = GLib.build_filenamev([global.userdatadir, CONFIG_FILE]);
        try {
            config = JSON.parse(Cinnamon.get_file_contents_utf8_sync(configFile));
        } catch (e) {
            // If something goes wrong with the configuration file we use the default configuration values.
            config = DEFAULT_CONFIG;
        }
    }
    
};



/**
 * Trying to centralize code to launch files or locations using different methods.
 */
function launch() {}

launch.prototype =
{
    file: function(file)
    {
        Gio.app_info_launch_default_for_uri(file, global.create_app_launch_context());
    },
    
    command: function(location)
    {
        Main.Util.spawnCommandLine(location);
    }
}



/**
 * Load settings 
 */
function getSettings(schema_name, applet_dir)
{
    let schema_dir = applet_dir + "/schemas"

    // Check if schemas are available in .local or if it's installed system-wide
    if (GLib.file_test(schema_dir + '/gschemas.compiled', GLib.FileTest.EXISTS)) {
        schema_source = Gio.SettingsSchemaSource.new_from_directory(schema_dir, Gio.SettingsSchemaSource.get_default(), false);
        let schema = schema_source.lookup(SCHEMA_NAME, false);
        return new Gio.Settings({ settings_schema: schema });
    } else {
        if (Gio.Settings.list_schemas().indexOf(schema_name) == -1)
            throw "Schema \"%s\" not found.".format(schema_name);
        return new Gio.Settings({ schema: schema_name });
    }

}



/**
 * Go!!!!!!!
 */
function main(metadata, orientation)
{
    settings = getSettings(SCHEMA_NAME, APPLET_DIR);
        
    let all_in_one_places_applet = new MyApplet(orientation);
    return all_in_one_places_applet;
}
