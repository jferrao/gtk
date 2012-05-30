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



# Get extensions dir, i.e. parent directory relative to script current directory
extension_dir = os.getenv("HOME") + "/.local/share/gnome-shell/extensions"
metadata_file = "metadata.json"

extensions_webservice = "https://extensions.gnome.org/extension-query?uuid=%s"

EXTENSION_IFACE = 'org.gnome.Shell'
EXTENSION_PATH  = '/org/gnome/Shell'



class ExtensionTool:
    def __init__(self):
        try:
            self.bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
            self.proxy = Gio.DBusProxy.new_sync( self.bus, Gio.DBusProxyFlags.NONE, None,
                 EXTENSION_IFACE, EXTENSION_PATH, 'org.freedesktop.DBus.Properties', None)
        except:
            print "Exception: %s" % sys.exc_info()[1]
            exit()
 
    def get_shell_version(self):
        output = self.proxy.Get('(ss)', EXTENSION_IFACE, 'ShellVersion')
        return output
 
    def get_extension_api_version(self):
        output = self.proxy.Get('(ss)', EXTENSION_IFACE, 'ApiVersion')
        return output



def get_extensions_directories():
    return [dir_name for dir_name in os.listdir(extension_dir) if os.path.isdir(os.path.join(extension_dir, dir_name))]    



def get_local_extensions_info(directories):
    extensions = []
    for directory in directories:
        filename = "%s/%s/%s" % (extension_dir, directory, metadata_file)
        extension_data = get_local_extension_info(filename)
        if (extension_data):
            extensions.append(extension_data)
    return extensions



def get_local_extension_info(filename):
    if os.path.isfile(filename):
        f = open(filename, 'r')
        metadata = json.loads(f.read())
        f.close()
        extension = {}
        extension['uuid'] = metadata['uuid']
        extension['shell-version'] = metadata['shell-version']
        extension['version'] = metadata['version']
        return extension
    return False



def get_extension_info(uuid):
    url = extensions_webservice % uuid
    usock = urllib2.urlopen(url)
    if usock.getcode() == 200:
        return json.loads(usock.read())
    usock.close()
    return False


def main():
    
    # Test to get Gnome Shell Version
    #gnome = ExtensionTool()
    #gnome_shell_version = gnome.get_shell_version()    
    #print gnome_shell_version
    
    directories = get_extensions_directories()
    local_extensions = get_local_extensions_info(directories)
    
    for local in local_extensions:
        info = get_extension_info(local['uuid'])
        if '3.2' in info.get('extensions')[0].get('shell_version_map'):
            print info.get('extensions')[0].get('name')
            print "local:\t%s" % local['version']
            print "remote:\t%s" % info.get('extensions')[0].get('shell_version_map').get('3.2').get('version')



if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-v", "--verbose", action="store_true", default=False, dest="verbose", help="print event and action messages")
    (opts, args) = parser.parse_args()
    
    main()
