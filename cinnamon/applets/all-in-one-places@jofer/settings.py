#!/usr/bin/python
from gi.repository import Gtk
import os
import json
import collections
from gettext import gettext as _

class MyWindow(Gtk.Window):

    def __init__(self):
        
        
        f = open("./config.json", 'r')
        self.config = json.loads(f.read(), object_pairs_hook=collections.OrderedDict)
        f.close()
        
        Gtk.Window.__init__(self, title="All-in-one Places Appplet Settings")

        self.set_border_width(10)


        box_container = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box_container.set_homogeneous(False)

        # Container box
        box_options = Gtk.Box(spacing=10)
        box_options.set_homogeneous(False)
        
        # Left options column
        vbox_left = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        vbox_left.set_homogeneous(False)

        # Center options column
        vbox_center = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        vbox_center.set_homogeneous(False)
        
        # Righ options column
        vbox_right = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        vbox_right.set_homogeneous(False)

        box_options.pack_start(vbox_left, True, True, 0)
        box_options.pack_start(vbox_center, True, True, 0)
        box_options.pack_start(vbox_right, True, True, 0)

        # Bottom options box
        box_extra = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        box_extra.set_homogeneous(False)

        # Buttons box
        box_buttons = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        box_buttons.set_homogeneous(False)
        
        box_container.pack_start(box_options, True, True, 0)
        box_container.pack_start(box_extra, True, True, 0)
        box_container.pack_start(box_buttons, True, True, 0)




        # Build options for left column
        if (self.config.has_key('SHOW_PANEL_ICON')):
            self.check_show_panel_icon = Gtk.CheckButton("Show panel icon")
            self.check_show_panel_icon.connect('toggled', self.change_option_state, 'SHOW_PANEL_ICON')
            self.check_show_panel_icon.set_active(self.config['SHOW_PANEL_ICON'])
            vbox_left.pack_start(self.check_show_panel_icon, True, True, 0)        

        if (self.config.has_key('USE_FULL_COLOR_ICON')):
            self.check_use_full_color_icon = Gtk.CheckButton("Use full color icon")
            self.check_use_full_color_icon.connect('toggled', self.change_option_state, 'USE_FULL_COLOR_ICON')
            self.check_use_full_color_icon.set_active(self.config['USE_FULL_COLOR_ICON'])
            vbox_left.pack_start(self.check_use_full_color_icon, True, True, 0)        

        if (self.config.has_key('SHOW_PANEL_TEXT')):
            self.check_show_panel_text = Gtk.CheckButton("Show panel text")
            self.check_show_panel_text.connect('toggled', self.change_option_state, 'SHOW_PANEL_TEXT')
            self.check_show_panel_text.set_active(self.config['SHOW_PANEL_TEXT'])
            vbox_left.pack_start(self.check_show_panel_text, True, True, 0)        

        # Panel text goes here !!!

        if (self.config.has_key('SHOW_DESKTOP')):
            self.check_show_desktop = Gtk.CheckButton("Show desktop")
            self.check_show_desktop.connect('toggled', self.change_option_state, 'SHOW_DESKTOP')
            self.check_show_desktop.set_active(self.config['SHOW_DESKTOP'])
            vbox_left.pack_start(self.check_show_desktop, True, True, 0)        

        if (self.config.has_key('AUTO_HIDE_TRASH')):
            self.check_auto_hide_trash = Gtk.CheckButton("Auto hide trash")
            self.check_auto_hide_trash.connect('toggled', self.change_option_state, 'SHOW_PANEL_ICON')
            self.check_auto_hide_trash.set_active(self.config['AUTO_HIDE_TRASH'])
            vbox_left.pack_start(self.check_auto_hide_trash, True, True, 0)        

        if (self.config.has_key('SHOW_FILE_SYSTEM')):
            self.check_show_filesystem = Gtk.CheckButton("Show file system")
            self.check_show_filesystem.connect('toggled', self.change_option_state, 'SHOW_FILE_SYSTEM')
            self.check_show_filesystem.set_active(self.config['SHOW_FILE_SYSTEM'])
            vbox_left.pack_start(self.check_show_filesystem, True, True, 0)        

        # Build options for center column
        if (self.config.has_key('SHOW_BOOKMARKS')):
            self.check_show_bookmarks = Gtk.CheckButton("Show bookmarks section")
            self.check_show_bookmarks.connect('toggled', self.change_option_state, 'SHOW_BOOKMARKS')
            self.check_show_bookmarks.set_active(self.config['SHOW_BOOKMARKS'])
            vbox_center.pack_start(self.check_show_bookmarks, True, True, 0)        

        if (self.config.has_key('COLLAPSE_BOOKMARKS')):
            self.check_collapse_bookmarks = Gtk.CheckButton("Dropdown style")
            self.check_collapse_bookmarks.connect('toggled', self.change_option_state, 'COLLAPSE_BOOKMARKS')
            self.check_collapse_bookmarks.set_active(self.config['COLLAPSE_BOOKMARKS'])
            vbox_center.pack_start(self.check_collapse_bookmarks, True, True, 0)        

        if (self.config.has_key('SHOW_DEVICES')):
            self.check_show_devices = Gtk.CheckButton("Show devices section")
            self.check_show_devices.connect('toggled', self.change_option_state, 'SHOW_DEVICES')
            self.check_show_devices.set_active(self.config['SHOW_DEVICES'])
            vbox_center.pack_start(self.check_show_devices, True, True, 0)        

        if (self.config.has_key('COLLAPSE_DEVICES')):
            self.check_collapse_devices = Gtk.CheckButton("Dropdown style")
            self.check_collapse_devices.connect('toggled', self.change_option_state, 'COLLAPSE_DEVICES')
            self.check_collapse_devices.set_active(self.config['COLLAPSE_DEVICES'])
            vbox_center.pack_start(self.check_collapse_devices, True, True, 0)        

        if (self.config.has_key('SHOW_NETWORK')):
            self.check_show_network = Gtk.CheckButton("Show network section")
            self.check_show_network.connect('toggled', self.change_option_state, 'SHOW_NETWORK')
            self.check_show_network.set_active(self.config['SHOW_NETWORK'])
            vbox_center.pack_start(self.check_show_network, True, True, 0)        

        if (self.config.has_key('COLLAPSE_NETWORK')):
            self.check_collapse_network = Gtk.CheckButton("Dropdown style")
            self.check_collapse_network.connect('toggled', self.change_option_state, 'COLLAPSE_NETWORK')
            self.check_collapse_network.set_active(self.config['COLLAPSE_NETWORK'])
            vbox_center.pack_start(self.check_collapse_network, True, True, 0)  

        # Build options for right column
        if (self.config.has_key('SHOW_SEARCH')):
            self.check_show_search = Gtk.CheckButton("Show search")
            self.check_show_search.connect('toggled', self.change_option_state, 'SHOW_SEARCH')
            self.check_show_search.set_active(self.config['SHOW_SEARCH'])
            vbox_right.pack_start(self.check_show_search, True, True, 0)        

        if (self.config.has_key('SHOW_RECENT_DOCUMENTS')):
            self.check_show_recent = Gtk.CheckButton("Show recent documents section")
            self.check_show_recent.connect('toggled', self.change_option_state, 'SHOW_RECENT_DOCUMENTS')
            self.check_show_recent.set_active(self.config['SHOW_RECENT_DOCUMENTS'])
            vbox_right.pack_start(self.check_show_recent, True, True, 0)        
        
        # Build extra options
        self.restart = False
        self.check_restart = Gtk.CheckButton("Restart Cinnamon on close")
        self.check_restart.connect('toggled', self.change_restart_status)
        self.check_restart.set_active(False)
        box_extra.pack_start(self.check_restart, True, True, 0)        

        # Build buttons
        bt_restart = Gtk.Button(_("Restart Cinnamon"))
        bt_restart.connect('clicked', self.restart_shell)
        box_buttons.pack_start(bt_restart, False, True, 0)

        bt_close = Gtk.Button(_("Close"))
        bt_close.connect('clicked', self.exit_application)
        box_buttons.pack_start(bt_close, False, True, 0)

        self.add(box_container)



    def change_restart_status(self, widget):
        if widget.get_active():
            self.restart = True
        else:
            self.restart = False

    def change_option_state(self, widget, key):
        if (self.config.has_key(key)):
            self.config[key] = widget.get_active();
        self.save_config_file(json.dumps(self.config, sort_keys=False, indent=4))

    def save_config_file(self, contents):
        f = open("./config.json", 'w')
        f.write(contents)
        f.close()    

    def restart_shell(self, widget):
        os.system('cinnamon --replace &')
        self.check_restart.set_active(False)

    def exit_application(self, widget):
        if (self.restart):
            os.system('cinnamon --replace &')
            self.check_restart.set_active(False)
        else:
            Gtk.main_quit()


win = MyWindow()
win.connect("delete-event", Gtk.main_quit)
win.show_all()
Gtk.main()
    
