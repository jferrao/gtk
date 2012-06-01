#!/usr/bin/python



import dbus
from optparse import OptionParser



SERVICE_IFACE = "org.jofer.shell.extensions.updatenotifier"
SERVICE_PATH = "/org/jofer/shell/extensions/updatenotifier"



def main():
    bus = dbus.SessionBus()
    service = bus.get_object(SERVICE_IFACE, SERVICE_PATH)

    if opts.extensions:
        check_extensions = service.get_dbus_method('check_extensions', SERVICE_IFACE)
        print check_extensions()
        
    if opts.shutdown:
        shutdown = service.get_dbus_method('shutdown', SERVICE_IFACE)
        shutdown()



if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-e", "--extensions", action="store_true", default=False, dest="extensions", help="get extensions")
    parser.add_option("-s", "--shutdown", action="store_true", default=False, dest="shutdown", help="shutdown service")
    (opts, args) = parser.parse_args()
    main()
