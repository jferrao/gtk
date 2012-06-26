/**
 * All-in-one Places extension for Gnome Shell.
 * http://jferrao.github.com/gtk
 * 
 * 
 * @author jferrao <jferrao@ymail.com>
 * @version 2.0
 * 
 */



/**
 * Import stuff ...
 */
const PanelMenu = imports.ui.panelMenu;
const Shell = imports.gi.Shell;

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

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lib = Extension.imports.lib;



const EXTENSION_UUID = "all-in-one-places@jofer"
const SCHEMA_NAME = "org.gnome.shell.extensions.AllInOnePlaces";

let settings;



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
            
        let label = new St.Label({ text: text });
        this.addActor(label);
        this.addActor(icon);
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
        eject_button.connect('clicked', Lang.bind(this, this._ejectDevice));
        this.addActor(eject_button);
    },
    
    _ejectDevice: function()
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

        this.trash_path = "trash:///";
        this.trash_file = Gio.file_new_for_uri(this.trash_path);

        this.text = text;

        this._checkTrashStatus();

        this.monitor = this.trash_file.monitor_directory(0, null, null);
        this._trashChanged = this.monitor.connect('changed', Lang.bind(this, this._checkTrashStatus));
    },
    
    destroy: function()
    {
        this.monitor.disconnect(this._trashChanged);
        this.actor.destroy();
    },
    
    _showTrashItem: function(icon)
    {
        this.label = new St.Label({ text: this.text });
        this.addActor(this.label);
        this.addActor(icon);
    },
    
    _showTrashItemEmpty: function()
    {
        this.icon = new St.Icon({icon_name: 'trashcan_empty', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this._showTrashItem(this.icon);
    },
    
    _showTrashItemFull: function()
    {
        this.icon = new St.Icon({icon_name: 'trashcan_full', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this._showTrashItem(this.icon);
        
        let empty_icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon ' });
        this.empty_button = new St.Button({ child: empty_icon });
        this.empty_button.connect('clicked', Lang.bind(this, this._confirmEmptyTrash));
        this.addActor(this.empty_button);
    },
    
    _clearTrashItem: function()
    {
        if (this.icon) this.removeActor(this.icon);
        if (this.label) this.removeActor(this.label);
        if (this.empty_button) this.removeActor(this.empty_button);
    },
    
    _checkTrashStatus: function()
    {
        let children = this.trash_file.enumerate_children('*', 0, null, null);
        if (children.next_file(null, null) == null) {
            this._clearTrashItem();
            this._showTrashItemEmpty();
            if (settings.get_boolean('hide-empty-trash-item')) {
                this.actor.visible = false;
            }
        } else {
            this._clearTrashItem();
            this._showTrashItemFull();
            if (settings.get_boolean('hide-empty-trash-item')) {
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
 * The extension itself
 */
function AllInOnePlaces(orientation)
{
    this._init(orientation);
}

AllInOnePlaces.prototype =
{
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function()
    {
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'folder');

        // Monitor settings changes and refresh menu on change
        this._settingsChanged = settings.connect('changed', Lang.bind(this, this._displayOnPanel));
        this._displayOnPanel();
    },

    _onButtonPress: function(actor, event)
    {
        let button = event.get_button();
        if (button == 1) {
            this._displayMenu();
        } else if (button == 3) {
            this._displayContext();
        }
        return PanelMenu.Button.prototype._onButtonPress.call(this, actor, event);
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
        
        // Clean up all actor's children
        this.actor.get_children().forEach(function(c) {
            c.destroy()
        });

        if (settings.get_boolean('show-panel-text')) {
            this.box = new St.BoxLayout();

            if (show_panel_icon) {
                this.icon = new St.Icon({ icon_name: 'folder', icon_size: settings.get_int('panel-icon-size'), icon_type: St.IconType.SYMBOLIC });
                this.box.add(this.icon);
                labelClass = 'places-label-icon';
            } else {
                labelClass = 'places-label';
            }
            let text = (settings.get_string('panel-text')) ? settings.get_string('panel-text') : _("Places");
            this.label = new St.Label({ text: text, style_class: labelClass });
            this.box.add(this.label);
        
            this.actor.add_actor(this.box);
        } else {
            this.icon = new St.Icon({ icon_name: 'folder', icon_size: settings.get_int('panel-icon-size'), icon_type: St.IconType.SYMBOLIC });
            this.actor.add_actor(this.icon);
        }
    },

    _displayContext: function()
    {
        this.menu.removeAll();
        let icon = new St.Icon({icon_name: 'gnome-settings', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.settingsItem = new MenuItem(icon, _("Settings"));
        this.settingsItem.connect('activate', function(actor, event) {
            new launch().command("gnome-shell-extension-prefs " + EXTENSION_UUID);
        });
        this.menu.addMenuItem(this.settingsItem);
    },

    _displayMenu: function()
    {
        // Clean up all menu items
        this.menu.removeAll();
        
        // Show home item
        //this._createHome();
        this.homeItem = this._createStandardItem('user-home', _("Home Folder"), settings.get_string('file-manager'));
        this.menu.addMenuItem(this.homeItem);

        // Show desktop item
        if (settings.get_boolean('show-desktop-item')) {
            this._createDesktop();
        }

        // Show trash item
        if (settings.get_boolean('show-trash-item')) {
            this._createTrash();
        }

        // Show bookmarks section
        if (settings.get_boolean('show-bookmarks-section')) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            if (settings.get_boolean('collapse-bookmarks-section')) {
                this._bookmarksSection = new PopupMenu.PopupSubMenuMenuItem(_("Bookmarks"));
                this.menu.addMenuItem(this._bookmarksSection);
                this._createBookmarks();
            } else {
                this._bookmarksSection = new PopupMenu.PopupMenuSection();
                this._createBookmarks();
                this.menu.addMenuItem(this._bookmarksSection);
            }
            
            // Monitor bookmarks changes
            this._bookmarksChanged = Main.placesManager.connect('bookmarks-updated', Lang.bind(this, this._redisplayBookmarks));
        }   
        
        // Show computer item
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._createComputer();

        // Show file system item
        if (settings.get_boolean('show-filesystem-item')) {
            this._createFileSystem();
        }

        // Show devices section
        if (settings.get_boolean('show-devices-section')) {
            if (settings.get_boolean('collapse-devices-section')) {
                this._devicesSection = new PopupMenu.PopupSubMenuMenuItem(_("Removable Devices"));
                this.menu.addMenuItem(this._devicesSection);
                this._createDevices();
            } else {
                this._devicesSection = new PopupMenu.PopupMenuSection();
                this._createDevices();
                this.menu.addMenuItem(this._devicesSection);
            }
            
            // Monitor mounts changes
            this._devicesChanged = Main.placesManager.connect('mounts-updated', Lang.bind(this, this._redisplayDevices));
        }

        // Show network section
        if (settings.get_boolean('show-network-section')) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            if (settings.get_boolean('collapse-network-section')) {
                this._networkSection = new PopupMenu.PopupSubMenuMenuItem(_("Network"));
                this.menu.addMenuItem(this._networkSection);
                this._createNetwork();
            } else {
                this._networkSection = new PopupMenu.PopupMenuSection();
                this._createNetwork();
                this.menu.addMenuItem(this._networkSection);
            }
        }

        if (settings.get_boolean('show-search-item') || settings.get_boolean('show-documents-section')) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Show search section
            if (settings.get_boolean('show-search-item')) {
                this._createSearch();
            }

            // Show recent documents section
            if (settings.get_boolean('show-documents-section')) {
                this.RecentManager = new Gtk.RecentManager();

                this._recentSection = new PopupMenu.PopupSubMenuMenuItem(_("Recent documents"));
                this.menu.addMenuItem(this._recentSection);
                this._createRecent();
            
                // Monitor recent documents changes 
                this._recentChanged = this.RecentManager.connect('changed', Lang.bind(this, this._redisplayRecent));
            }
        }
        
    },

    /**
     * Disconnect signals
     */
    disconnect: function()
    {
        if (this._settingsChanged) settings.disconnect(this._settingsChanged);
        if (this._bookmarksChanged) Main.placesManager.disconnect(this._bookmarksChanged);
        if (this._devicesChanged) Main.placesManager.disconnect(this._devicesChanged);
        if (this._recentChanged) this.RecentManager.disconnect(this._recentChanged);
    },
    
    _createStandardItem: function(icon, label, launcher)
    {
        let icon = new St.Icon({ icon_name: icon, icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR });
        let item = new MenuItem(icon, label);
        item.connect('activate', function(actor, event) {
            new launch().command(launcher);
        });
        return item;
    },

    /**
     * Build computer section
     */
    _createComputer: function()
    {
        let icon = new St.Icon({icon_name: 'computer', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.computerItem = new MenuItem(icon, _("Computer"));
        this.computerItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('file-manager') + " computer://");
        });
        this.menu.addMenuItem(this.computerItem);
    },
    
    /**
     * Build file system section
     */
    _createFileSystem: function()
    {
        let icon = new St.Icon({icon_name: 'drive-harddisk', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.filesystemItem = new MenuItem(icon, _("File System"));
        this.filesystemItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('file-manager') + " /");
        });
        this.menu.addMenuItem(this.filesystemItem);
    },

    /**
     * Build home section
     */
    _createHome: function()
    {
        let icon = new St.Icon({icon_name: 'user-home', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.homeItem = new MenuItem(icon, _("Home Folder"));
        this.homeItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('file-manager'));
        });
        this.menu.addMenuItem(this.homeItem);
    },

    /**
     * Build desktop section
     */
    _createDesktop: function()
    {
        let icon = new St.Icon({icon_name: 'user-desktop', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.desktopItem = new MenuItem(icon, _("Desktop"));
        this.desktopItem.connect('activate', function(actor, event) {
            let desktop_folder = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
            new launch().command(settings.get_string('file-manager') + " \"" + desktop_folder.replace(" ","\ ") + "\"");
        });
        this.menu.addMenuItem(this.desktopItem);
    },

    /**
     * Build trash section
     */
    _createTrash: function()
    {
        this.trashItem = new TrashMenuItem(_("Trash"));
        this.menu.addMenuItem(this.trashItem);
    },

    /**
     * Build bookmarks section
     */
    _createBookmarks : function()
    {
        this.bookmarks = Main.placesManager.getBookmarks();

        sectionMenu = (this._bookmarksSection.menu) ? this._bookmarksSection.menu : this._bookmarksSection;

        for (let bookmarkid = 0; bookmarkid < this.bookmarks.length; bookmarkid++) {
            let icon = this.bookmarks[bookmarkid].iconFactory(settings.get_int('item-icon-size'));
            let bookmarkItem = new MenuItem(icon, this.bookmarks[bookmarkid].name);
            bookmarkItem.place = this.bookmarks[bookmarkid];
            
            bookmarkItem.connect('activate', function(actor, event) {
                actor.place.launch();
            });
            sectionMenu.addMenuItem(bookmarkItem);
        }
    },
    
    _clearBookmarks : function()
    {
        sectionMenu = (this._bookmarksSection.menu) ?  this._bookmarksSection.menu : this._bookmarksSection;
        this._bookmarksSection.removeAll();
    },

    _redisplayBookmarks: function()
    {
        this._clearBookmarks();
        this._createBookmarks();
    },

    /**
     * Build devices section
     */
    _createDevices : function()
    {
        this.devices = Main.placesManager.getMounts();
        
        sectionMenu = (this._devicesSection.menu) ? this._devicesSection.menu : this._devicesSection;

        for (let devid = 0; devid < this.devices.length; devid++) {
            let icon = this.devices[devid].iconFactory(settings.get_int('item-icon-size'));
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
        
        let icon = new St.Icon({icon_name: 'network-workgroup', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.networkItem = new MenuItem(icon, _("Network"));
        this.networkItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('file-manager') + " network:///");
        });
        sectionMenu.addMenuItem(this.networkItem);
        
        let icon = new St.Icon({icon_name: 'gnome-globe', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.connectItem = new MenuItem(icon, _("Connect to..."));
        this.connectItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('connect-command'));
        });        
        sectionMenu.addMenuItem(this.connectItem);
    },


    /**
     * Build search section
     */
    _createSearch: function()
    {
        let icon = new St.Icon({icon_name: 'search', icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
        this.searchItem = new MenuItem(icon, _("Search"));
        this.menu.addMenuItem(this.searchItem);

        this.searchItem.connect('activate', function(actor, event) {
            new launch().command(settings.get_string('search-command'));
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
            while (id < settings.get_int('max-documents-documents') && id < this.RecentManager.size) {
                let icon =  new St.Icon({icon_name: items[id].get_mime_type().replace("\/","-"), icon_size: settings.get_int('item-icon-size'), icon_type: St.IconType.FULLCOLOR});
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
 * Go!!!!!!!
 */
function init() {}

let _indicator;

function enable()
{
    // Load settings
    try {
        settings = Lib.getSettings(Extension, SCHEMA_NAME);
    } catch(e) {
        throw new Error(_("Unable to load settings."));
    }

    _indicator = new AllInOnePlaces();

    // Icon on the Left or right panel
    if (settings.get_boolean('left-panel-menu')) {
        Main.panel._leftBox.insert_child_at_index(_indicator.actor, 1);
        Main.panel._leftBox.child_set(_indicator.actor, { y_fill : true } );
        Main.panel._menus.addMenu(_indicator.menu);
    } else {
        Main.panel.addToStatusArea('all-in-one-places', _indicator);
    }
}

function disable() {
    _indicator.disconnect();
    _indicator.destroy();
}
