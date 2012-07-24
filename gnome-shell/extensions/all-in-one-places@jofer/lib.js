const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext;

/**
 * Get settings from local or global scope, as default or fail safe.
 * 
 * @param extension
 * @param schema_name
 * @returns {Gio.Settings}
 */
function getSettings(extension, schema_name)
{
    let schema_dir = extension.dir.get_child('schemas').get_path();

    // Extension installed in .local
    if (GLib.file_test(schema_dir + '/gschemas.compiled', GLib.FileTest.EXISTS)) {
        let schema_source = Gio.SettingsSchemaSource.new_from_directory(schema_dir, Gio.SettingsSchemaSource.get_default(), false);
        let schema = schema_source.lookup(schema_name, false);
        return new Gio.Settings({ settings_schema: schema });
    }

    // Extension installed system-wide
    else {
        if (Gio.Settings.list_schemas().indexOf(schema_name) == -1) {
            throw new Error("Schema \"%s\" not found.".format(schema_name));
        }
        return new Gio.Settings({ schema: schema_name });
    }
}
