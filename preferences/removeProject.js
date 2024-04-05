import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { getConfig } from '../util/utils.js';

export var RemovePage = GObject.registerClass(
class RemoveProjectPage extends Adw.PreferencesPage {
    _init(window) {
        super._init({
            title: _('Remove Project'),
            icon_name: 'edit-delete-symbolic',
            name: 'RemoveProjectPage'
        });

        // Remove Project Page
        const rm_prj_group = new Adw.PreferencesGroup();
        this.add(rm_prj_group);
    
        const is_delete_row = new Adw.ActionRow({
            title: 'Remove Current Project',
            subtitle: 'This will not remove any files, just the project from the config.'
        });
    
        const removeButton = new Gtk.Button({
            label: 'Remove',
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.END,
            cssClasses: ['raised'],
        });

        removeButton.connect('clicked', () => {
            let config = getConfig();
            let prj_name = config.active;
            const message = 'Are you sure you want to remove \"'+ prj_name +'\"?';
    
            //  Create a dialog to confirm the action
            const dialog = new Gtk.AlertDialog({
                message: message,
                detail: 'Removing a project will remove it and all its children from the config, but not delete any of the files.',
                modal: true,
                buttons: [
                        'Cancel',
                        'Remove: ' + prj_name,
                ],
            });
    
            dialog.choose(window, null, (a,b) => {
                if (a.choose_finish(b) == 1) {
                    const proc = Gio.Subprocess.new(
                        ["change-prj", 
                            '--remove', 
                            prj_name
                        ],
                        Gio.SubprocessFlags.NONE
                    );

                    proc.communicate_utf8_async(null, null, (subprocess /*@type {Gio.Subprocess}*/, result /*@type {Gio.AsyncResult}*/, data) => {
                        const [success, stdout, stderr] = proc.communicate_utf8_finish(result)
                        if (!success) {
                            //  Create a dialog to show the error
                            const dialog = new Gtk.AlertDialog({
                                message: 'An error occurred while removing the project',
                                detail: stderr,
                                modal: true,
                                buttons: [
                                        'Ok',
                                ],
                            });
                            dialog.show();
                        }
                    });
                }
            });
        });

        is_delete_row.add_suffix(removeButton);    

        const open_project_folder = new Adw.ActionRow({
            title: 'Open Project Folder in File Manager',
            subtitle: 'So you can delete the folder yourself'
        });


        const openButton = new Gtk.Button({
            label: 'Open',
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.END,
            cssClasses: ['raised'],
        });
        open_project_folder.add_suffix(openButton);
        openButton.connect('clicked', () => {
            const config = getConfig();
            
            console.log("Opening folder for project: " + config.active);
            let proc = Gio.Subprocess.new(
                ["change-prj",
                    "--get-url",
                    config.active
                ],
                Gio.SubprocessFlags.STDOUT_PIPE
            );

            proc.communicate_utf8_async(null, null, (subprocess /*@type {Gio.Subprocess}*/, result /*@type {Gio.AsyncResult}*/, data) => {
                const [success, stdout, stderr] = proc.communicate_utf8_finish(result)
                if (stdout != "") {
                    const folder = 'file://'+stdout.trim();
                    Gio.AppInfo.launch_default_for_uri(folder, null);
                }
            });
        });

        rm_prj_group.add(is_delete_row);
        rm_prj_group.add(open_project_folder);
    }
});