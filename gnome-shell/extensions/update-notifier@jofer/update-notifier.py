#!/usr/bin/python

'''
Check Gnome Shell extension updates.
http://jferrao.github.com/gtk

Requires Python 2.7


@author jferrao <jferrao@ymail.com>
@version 1.0

'''



from optparse import OptionParser
import os, sys, argparse
import json
import urllib2

from gi.repository import Gio

import gtk
import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop



BLACKLIST_FILE = os.path.dirname(os.path.abspath(__file__)) + "/blacklist.json"

# Get extensions dir, i.e. parent directory relative to script current directory
EXTENSIONS_PATH = os.getenv("HOME") + "/.local/share/gnome-shell/extensions"
METADATA_FILE = "metadata.json"

EXTENSIONS_SERVICE = "https://extensions.gnome.org/extension-query?uuid=%s"
EXTENSIONS_BASEURL = "https://extensions.gnome.org%s"

SERVICE_IFACE = "org.jofer.shell.extensions.updatenotifier"
SERVICE_PATH = "/org/jofer/shell/extensions/updatenotifier"

EXTENSION_IFACE = "org.gnome.Shell"
EXTENSION_PATH  = "/org/gnome/Shell"
#EXTENSION_IFACE = "org.Cinnamon"
#EXTENSION_PATH  = "/org/Cinnamon"

blacklist = []


class DBusService(dbus.service.Object):
    def __init__(self):
        bus_name = dbus.service.BusName(SERVICE_IFACE, bus=dbus.SessionBus())
        dbus.service.Object.__init__(self, bus_name, SERVICE_PATH)
 
    @dbus.service.method(SERVICE_IFACE)
    def check_extensions(self):
        return Notifier().get_extensions()



class Gnome:
    def __init__(self):
        try:
            self.bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
            self.proxyp = Gio.DBusProxy.new_sync(self.bus, Gio.DBusProxyFlags.NONE, None, EXTENSION_IFACE, EXTENSION_PATH, 'org.freedesktop.DBus.Properties', None)
            self.proxy = Gio.DBusProxy.new_sync(self.bus, Gio.DBusProxyFlags.NONE, None, EXTENSION_IFACE, EXTENSION_PATH, EXTENSION_IFACE, None)
        except:
            print "Exception: %s" % sys.exc_info()[1]
            exit()
 
    def get_shell_version(self):
        output = self.proxyp.Get('(ss)', EXTENSION_IFACE, 'ShellVersion')
        #output = self.proxyp.Get('(ss)', EXTENSION_IFACE, 'CinnamonVersion')
        return output
 
    def get_extension_api_version(self):
        output = self.proxyp.Get('(ss)', EXTENSION_IFACE, 'ApiVersion')
        return output

    def get_extensions(self):
        output = self.proxy.ListExtensions()
        return output



class Notifier:
    def __init__(self):
        self.result = {'total': 0, 'extensions': []}

        # Get extensions that shouldn't be checked for updates
        self.load_blacklist()

        self.gnome = Gnome()
        self.shell_version = Version(self.gnome.get_shell_version()).shrink()

    def get_extensions(self):
        local_extensions = self.gnome.get_extensions()
        #local_extensions = self.get_local_extensions_info(self.get_extensions_directories())
        
        for uuid, local_extension in local_extensions.items():
            # Only check for extensions located in the user directory
            if local_extension['path'] == "%s/%s" % (EXTENSIONS_PATH, local_extension['uuid']) and local_extension['uuid'] not in blacklist:
                remote_extension = self.get_extension_info(local_extension['uuid'])
                if remote_extension['extensions']:
                    if (opts.verbose):
                        print "%s (local: %s | remote: %s)" % (local_extension['name'], local_extension['version'], remote_extension['extensions'][0]['shell_version_map'][self.shell_version]['version']),
        
                    if self.shell_version in remote_extension['extensions'][0]['shell_version_map'] and (float(remote_extension['extensions'][0]['shell_version_map'][self.shell_version]['version']) > float(local_extension['version'])):
                        self.result['total'] += 1
                        self.result['extensions'].append({'uuid': remote_extension['extensions'][0]['uuid'], 'name': remote_extension['extensions'][0]['name'], 'url': EXTENSIONS_BASEURL % remote_extension['extensions'][0]['link']})
                        if (opts.verbose):
                            print "Update"
                    else:
                        if (opts.verbose):
                            print "Ok"
        return self.result

    def get_extensions_directories(self):
        return [dir_name for dir_name in os.listdir(EXTENSIONS_PATH) if os.path.isdir(os.path.join(EXTENSIONS_PATH, dir_name))]    

    def get_local_extensions_info(self, directories):
        extensions = {}
        for directory in directories:
            filename = "%s/%s/%s" % (EXTENSIONS_PATH, directory, METADATA_FILE)
            extension_data = self.get_local_extension_info(filename)
            if (extension_data):
                extensions.update(extension_data)
        return extensions

    def get_local_extension_info(self, filename):
        if os.path.isfile(filename):
            f = open(filename, 'r')
            metadata = json.loads(f.read())
            f.close()
            extension = {metadata['uuid']: {
                'uuid': metadata['uuid'],
                'name': metadata['name'],
                'shell-version': metadata['shell-version'],
                'version': metadata['version']
            }}
            return extension
        return False

    def get_extension_info(self, uuid):
        url = EXTENSIONS_SERVICE % uuid
        usock = urllib2.urlopen(url)
        if usock.getcode() == 200:
            return json.loads(usock.read())
        usock.close()
        return False

    def load_blacklist(self):
        global blacklist
        if os.path.isfile(BLACKLIST_FILE):
            f = open(BLACKLIST_FILE, 'r')
            blacklist = json.loads(f.read())
            f.close()


class Version():
    def __init__(self, version):
        self.version = version
        
    def shrink(self):
        # Retain only version.revision of the entire shell version string.
        version = self.version.split(".")
        return ".".join(version[0:2])



def main():

    if opts.dbus:
        DBusGMainLoop(set_as_default=True)
        service = DBusService()
        gtk.main()
    else:
        print Notifier().get_extensions()



if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-v", "--verbose", action="store_true", default=False, dest="verbose", help="print event and action messages")
    parser.add_option("-d", "--dbus", action="store_true", default=False, dest="dbus", help="use script as a D-Bus service")
    (opts, args) = parser.parse_args()
    
    main()
