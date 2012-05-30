#!/usr/bin/python

'''
Check Gnome Shell extension updates.
http://jferrao.github.com/gtk

Requires Python 2.7


@author jferrao <jferrao@ymail.com>
@version 1.0

'''



from optparse import OptionParser
import os, os.path
import json



# Get extensions dir, i.e. parent directory relative to script current directory
#extension_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.pardir))
extension_dir = os.getenv("HOME") + "/.local/share/gnome-shell/extensions"
metadata_file = "metadata.json"




def load_metadata_file(filename):
    if os.path.isfile(filename):
        f = open(filename, 'r')
        metadata = json.loads(f.read())
        f.close()
        return metadata
    return False



def get_extensions_directories():
    return [dir_name for dir_name in os.listdir(extension_dir) if os.path.isdir(os.path.join(extension_dir, dir_name))]    



def get_local_extensions_info(directories):
    extensions = []
    for directory in directories:
        filename = "%s/%s/%s" % (extension_dir, directory, metadata_file)
        extension_data = load_metadata_file(filename)
        if (extension_data):
            extension = {}
            extension['uuid'] = extension_data['uuid']
            extension['shell-version'] = extension_data['shell-version']
            extension['version'] = extension_data['version']
            extensions.append(extension)
    return extensions



def main():
    directories = get_extensions_directories()
    print get_local_extensions_info(directories)
    


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-v", "--verbose", action="store_true", default=False, dest="verbose", help="print event and action messages")
    (opts, args) = parser.parse_args()
    
    main()
