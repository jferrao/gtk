 #!/usr/bin/env python -W ignore::DataLossWarning


# For now, lets just ignore BeautifulSoup warnings ...
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

import urllib2
from BeautifulSoup import BeautifulSoup

import os
import json
import zipfile



SCRAPE_FILE = os.path.dirname(os.path.abspath(__file__)) + "/scrape.json"
APLLETS_LIST_FILE = os.path.dirname(os.path.abspath(__file__)) + "/applets.json"
TMP_DIR = os.path.dirname(os.path.abspath(__file__)) + "/tmp"



def load_json(file):
    if os.path.isfile(file):
        f = open(file, 'r')
        result = json.loads(f.read())
        f.close()
        return result
    return False

def save_json(file, data):
    f = open(file, 'w')
    f.write(json.dumps(data, sort_keys=False, indent=4))
    f.close()





def get_latest_applets():
    applet_list = []
    sock = urllib2.urlopen("http://cinnamon-spices.linuxmint.com/applets/welcome/last_edited")
    content = sock.read()

    tree = BeautifulSoup(content)
    table = tree.find('table')
    cols = table.findAll('td')
    for col in cols:
        anchor = col.find('a')
        applet_list.append(anchor['href'])

    sock.close()
    
    return applet_list





# Get all applets in latest applets webpage
applets = get_latest_applets()
scrape_list = load_json(SCRAPE_FILE)

for applet_url in applets:
    
    # Get data from applet's page
    sock = urllib2.urlopen(applet_url)
    content = sock.read()
    
    tree = BeautifulSoup(content)
    applet = {}
    #applet['a_uuid'] = tree.find('i').find('font').string[6:]
    #applet['a_link'] = applet_url
    applet['page_id'] = "/".join(applet_url.split("/")[-1:])

    for atag in tree.findAll('a'):
        if atag.string == "Website":
            applet['creator_url'] = atag['href']
        if atag['href'][-4:] == ".zip":
            applet['download'] = atag['href']
            applet['zip_uuid'] = atag['href'][-18:-4]
            break

    # Check if applet exists in scrape.json and compare zip uuid
    if applet['page_id'] in scrape_list:
        # If the zip uuid is a match stop the loop ... there are no more applets updated!
        if scrape_list[applet['page_id']] == applet['zip_uuid']:
            print "Found a match ... exiting ..."
            break
        else:
            # We've got a new one, let's download the zip file and get the information from the metadata.json
            print "Opening Zip file"
            zip_file = urllib2.urlopen(applet['download'])
            output = open("%s/%s.zip" % (TMP_DIR, applet['zip_uuid']), 'wb')
            output.write(zip_file.read())
            output.close()
            
            # Extract metadata.json from zip file
            print "Extracting Zip file"
            zip_file = zipfile.ZipFile("%s/%s.zip" % (TMP_DIR, applet['zip_uuid']), 'r')
            for member in zip_file.infolist():
                if member.filename[-13:] == "metadata.json":
                    #zip_file.extract(member.filename, TMP_DIR)
                    extracted = zip_file.open(member.filename)
                    output = open("%s/metadata.json" % TMP_DIR, 'wb')
                    output.write(extracted.read())
                    output.close()
            zip_file.close()
            
            # Read applet data from metadata.json and update applet list
            print "Reading da from metadata.json and updating applet list"
            metadata = load_json("%s/metadata.json" % TMP_DIR)
            applet_list = load_json(APLLETS_LIST_FILE)
            applet_list[metadata['uuid']] = {}
            if 'uuid' in metadata: applet_list[metadata['uuid']]['uuid'] = metadata['uuid']
            if 'version' in metadata: applet_list[metadata['uuid']]['version'] = metadata['version']
            if 'name' in metadata: applet_list[metadata['uuid']]['name'] = metadata['name']
            if 'description' in metadata: applet_list[metadata['uuid']]['description'] = metadata['description']
            if 'creator' in metadata: applet_list[metadata['uuid']]['creator'] = metadata['creator']
            if 'creator_url' in applet: applet_list[metadata['uuid']]['creator_url'] = applet['creator_url']
            applet_list[metadata['uuid']]['link'] = applet_url
            
            # Save new data to applets.json
            save_json(APLLETS_LIST_FILE, applet_list)

            # Clean it up
            print "Removing files"
            os.remove("%s/metadata.json" % TMP_DIR)
            os.remove("%s/%s.zip" % (TMP_DIR, applet['zip_uuid']))
    
    # Update scrape list
    scrape_list[applet['page_id']] = applet['zip_uuid']
    save_json(SCRAPE_FILE, scrape_list)

   

    
