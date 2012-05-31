import dbus

SERVICE_IFACE = "org.jofer.shell.extensions.updatenotifier"
SERVICE_PATH = "/org/jofer/shell/extensions/updatenotifier"

bus = dbus.SessionBus()
service = bus.get_object(SERVICE_IFACE, SERVICE_PATH)
check_extensions = service.get_dbus_method('check_extensions', SERVICE_IFACE)
print check_extensions()
