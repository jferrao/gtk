#!/usr/bin/python

'''
Settings Application for the All-in-one Places applet for Cinnamon
Requires Python 2.7

@developer jferrao <jferrao@ymail.com>
@url http://jferrao.github.com/gtk

'''



from gi.repository import Gtk
import os
import json
import collections
from gettext import gettext as _



config = None



class MyWindow(Gtk.Window):

    def __init__(self):
        
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
        if (config.has_key('SHOW_PANEL_ICON')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'SHOW_PANEL_ICON', config['SHOW_PANEL_ICON'], "Show panel icon")

        if (config.has_key('USE_FULL_COLOR_ICON')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'USE_FULL_COLOR_ICON', config['USE_FULL_COLOR_ICON'], "Use full color icon")

        if (config.has_key('SHOW_PANEL_TEXT')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'SHOW_PANEL_TEXT', config['SHOW_PANEL_TEXT'], "Show panel text")

        if (config.has_key('PANEL_TEXT')):
            use_custom_panel_text = False if (config['PANEL_TEXT'] == None) else True
            # Custom text option
            self.check_custom_text = Gtk.CheckButton("Use custom panel text")
            self.check_custom_text.set_active(use_custom_panel_text)
            vbox_left.pack_start(self.check_custom_text, True, True, 0)        
            
            # Custom text entry
            self.entry_panel_text = Gtk.Entry()
            self.entry_panel_text.connect('changed', self.print_event)
            if (use_custom_panel_text):
                if (config['PANEL_TEXT'] != None):
                    self.entry_panel_text.set_text(panel_text)
            else:
                self.entry_panel_text.set_sensitive(False)
            vbox_left.pack_start(self.entry_panel_text, True, True, 0) 
            
            # Connect events
            self.check_custom_text.connect('toggled', self.change_custom_text_state, self.entry_panel_text)

        if (config.has_key('SHOW_DESKTOP')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'SHOW_DESKTOP', config['SHOW_DESKTOP'], "Show desktop")

        if (config.has_key('AUTO_HIDE_TRASH')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'AUTO_HIDE_TRASH', config['AUTO_HIDE_TRASH'], "Auto hide trash")

        if (config.has_key('SHOW_FILE_SYSTEM')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_left, 'SHOW_FILE_SYSTEM', config['SHOW_FILE_SYSTEM'], "Show file system")

        # Build options for center column
        if (config.has_key('SHOW_BOOKMARKS')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'SHOW_BOOKMARKS', config['SHOW_BOOKMARKS'], "Show bookmarks section")

        if (config.has_key('COLLAPSE_BOOKMARKS')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'COLLAPSE_BOOKMARKS', config['COLLAPSE_BOOKMARKS'], "Dropdown style bookmarks")

        if (config.has_key('SHOW_DEVICES')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'SHOW_DEVICES', config['SHOW_DEVICES'], "Show devices section")

        if (config.has_key('COLLAPSE_DEVICES')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'COLLAPSE_DEVICES', config['COLLAPSE_DEVICES'], "Dropdown style devices")

        if (config.has_key('SHOW_NETWORK')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'SHOW_NETWORK', config['SHOW_NETWORK'], "Show network section")

        if (config.has_key('COLLAPSE_NETWORK')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_center, 'COLLAPSE_NETWORK', config['COLLAPSE_NETWORK'], "Dropdown style network")

        # Build options for right column
        if (config.has_key('SHOW_SEARCH')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_right, 'SHOW_SEARCH', config['SHOW_SEARCH'], "Show search")

        if (config.has_key('SHOW_RECENT_DOCUMENTS')):
            check_show_panel = check_option()
            check_show_panel.create(vbox_right, 'SHOW_RECENT_DOCUMENTS', config['SHOW_RECENT_DOCUMENTS'], "Show recent documents section")
        
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


    def print_event(self, widget):
        print "hello"

    def change_restart_status(self, widget):
        if widget.get_active():
            self.restart = True
        else:
            self.restart = False

    def change_custom_text_state(self, option_control, text_control):
        if option_control.get_active():
            text_control.set_sensitive(True)
            text_control.grab_focus()
        else:
            text_control.set_sensitive(False)
        print "changed"

    def restart_shell(self, widget):
        os.system('cinnamon --replace &')
        self.check_restart.set_active(False)

    def exit_application(self, widget):
        if (self.restart):
            os.system('cinnamon --replace &')
            self.check_restart.set_active(False)
        else:
            Gtk.main_quit()





class check_option():
    
    def create(self, box, key, value, label):
        innerbox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 40)

        widget = Gtk.Switch()
        widget.set_active(value)
        widget.connect('notify::active', self.change_state, key)

        label = Gtk.Label(label)

        innerbox.pack_start(label, False, False, 10)
        innerbox.pack_start(widget, False, False, 0)        

        box.pack_start(innerbox, False, False, 0)        

    def change_state(self, widget, notice, key):
        global config
        if (config.has_key(key)):
            config[key] = widget.get_active();
        save_config()
        print "changed"





def load_config():
    global config
    f = open("./config.json", 'r')
    config = json.loads(f.read(), object_pairs_hook=collections.OrderedDict)
    f.close()
    print "loaded config"

def save_config():
    f = open("./config.json", 'w')
    f.write(json.dumps(config, sort_keys=False, indent=4))
    f.close()
    print "saved config"




load_config()

win = MyWindow()
win.connect("delete-event", Gtk.main_quit)
win.show_all()
Gtk.main()
    
