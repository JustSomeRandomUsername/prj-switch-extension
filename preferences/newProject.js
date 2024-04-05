import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export var NewPage = GObject.registerClass(
class NewProjectPage extends Adw.PreferencesPage {
    _init(config, window) {
        super._init({
            title: _('New Project'),
            icon_name: 'document-new-symbolic',
            name: 'NewProjectPage'
        });

        // New Project Page
        const add_prj_group = new Adw.PreferencesGroup();
        this.add(add_prj_group);
    
        // Setup List of All Project Names 
        const name_list = new Gtk.StringList();
        const addItem = (prj) => {
            name_list.append(prj.name)
            for (const child of prj.children) {
                addItem(child);
            }
        }
        addItem(config.all_prjs);
    
        // Parent Selector 
        let parentRow = new Adw.ComboRow({
            title: 'Parent',
            model: name_list,
        });
        add_prj_group.add(parentRow);
    
        // Name Entry
        const entryRow = new Adw.ActionRow({ title: _('Name') });
        add_prj_group.add(entryRow);
    
        const name = new Gtk.Entry({
            placeholder_text: 'Project name',
        });
        entryRow.add_suffix(name);
    
        // Folder Toggles
        const folders = [];
        for (const folder of [["Music","folder-music"], ["Videos", "folder-videos"], 
                                ["Pictures", "folder-pictures"], ["Desktop","user-desktop"], 
                                ["Documents", "folder-documents"], ["Downloads", "folder-download"]]) {
            const row = new Adw.ActionRow({ title: folder[0] });
            add_prj_group.add(row);
            const toggle = new Gtk.Switch({
                active: true,
                valign: Gtk.Align.CENTER,
            });
            folders.push([toggle, folder[0]]);
            row.add_suffix(toggle);
            const icon = new Gtk.Image({
                icon_name: ""+folder[1],
            });
            row.add_prefix(icon);
        }

        // Create Button
        const createButton = new Gtk.Button({
            label: 'Add new',
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.END,
            cssClasses: ['raised'],
        });
        add_prj_group.add(createButton);
    
        createButton.connect('clicked', () => {
            const proc = Gio.Subprocess.new(
                ["change-prj", 
                    '--new',
                    '--parent', name_list.get_string(parentRow.get_selected()),
                    '--folders=' +folders.filter((x) => x[0].active).map((x) => x[1]).join(" "),
                    name.text
                ],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            console.log("Adding project");
            proc.communicate_utf8_async(null, null, (subprocess /*@type {Gio.Subprocess}*/, result /*@type {Gio.AsyncResult}*/, data) => {
                const [success, stdout, stderr] = proc.communicate_utf8_finish(result)
                if (stderr != "") {
                    //  Create a dialog to show the error
                    const dialog = new Gtk.AlertDialog({
                        message: 'An error occurred while adding the project',
                        detail: stderr,
                        modal: true,
                        buttons: [
                                'Ok',
                        ],
                    });
                    dialog.show(window);
                }
            });
            
            name.text = "";
            for (const folder of folders) {
                folder[0].active = true;
            }
            parentRow.set_selected(0);
            //TODO update UI
        });
    }
});