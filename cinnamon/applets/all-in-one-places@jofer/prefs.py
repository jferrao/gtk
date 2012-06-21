#!/usr/bin/python

'''
Settings Application for the All-in-one Places applet for Cinnamon.
http://jferrao.github.com/gtk

Requires Python 2.7


@author jferrao <jferrao@ymail.com>
@version 1.1

'''





from optparse import OptionParser
from gi.repository import Gio, Gtk
import os
import json
import collections

from gettext import gettext as _


SCHEMA = "org.gnome.shell.extensions.AllInOnePlaces"

settings = Gio.Settings.new(SCHEMA)



class MyWindow(Gtk.Window):

    restart = False

    def __init__(self):
        
        Gtk.Window.__init__(self, title="All-in-one Places Applet Settings")

        frame = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        frame.set_homogeneous(False)

        box_panel = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        box_panel.set_homogeneous(False)
        
        switch_panel_icon = widgets().switch('show-panel-icon', "Show panel icon")
        box_panel.pack_start(switch_panel_icon, False, False, 5)
        
        
        
        
        
        tabs = Gtk.Notebook();
        tabs.set_scrollable(True);
        tabs.set_size_request(100, 100);
        tabs.append_page(box_panel, Gtk.Label(label="Global"));
    
        frame.pack_start(tabs, False, False, 0)
    
        frame.show_all()
        self.add(frame)

        



class widgets():
    
    def switch(self, key, label):
        global settings

        box = Gtk.HBox()
        label = Gtk.Label(label)
        
        widget = Gtk.Switch()
        widget.set_active(settings.get_boolean(key))
        widget.connect('notify::active', self._switch_state, key)

        box.pack_start(label, False, False, 0)
        box.pack_end(widget, False, False, 0)        

        return box
        
    def _switch_state(self, widget, notice, key):
        global settings
        settings.set_boolean(key, widget.get_active())	





if __name__ == "__main__":
    win = MyWindow()
    win.connect("delete-event", Gtk.main_quit)
    win.show_all()
    Gtk.main()
