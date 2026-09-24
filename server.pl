#!/usr/bin/perl
# Lokaler AppHub-Server in Perl (kein Python noetig; Perl ist auf jedem Mac/Linux vorinstalliert).
# Macht dasselbe wie server.py: liefert die App aus und speichert alle App-Daten in
# "appdata.json" in diesem Ordner (mit taeglichen Sicherungskopien in "backups/").
#
# Aufruf:  perl server.pl [--port 8080] [--idle-minutes 45]
use strict;
use warnings;
use IO::Socket::INET;
use IO::Select;
use JSON::PP;
use File::Basename qw(dirname);
use File::Spec;
use File::Copy qw(copy move);
use Cwd qw(abs_path);
use POSIX qw(strftime);

my $port = 8080;
my $idle = 0;
while (@ARGV) {
    my $a = shift @ARGV;
    if ($a eq '--port') { $port = shift @ARGV }
    elsif ($a eq '--idle-minutes') { $idle = shift @ARGV }
}

my $ROOT    = abs_path(dirname(abs_path($0)));
my $DATA    = "$ROOT/appdata.json";
my $BACKUPS = "$ROOT/backups";
my $MARK    = "$ROOT/appdata.migrated";

my %MIME = (
    html => 'text/html; charset=utf-8', htm => 'text/html; charset=utf-8',
    js => 'text/javascript; charset=utf-8', css => 'text/css; charset=utf-8',
    json => 'application/json; charset=utf-8', svg => 'image/svg+xml',
    png => 'image/png', jpg => 'image/jpeg', jpeg => 'image/jpeg', gif => 'image/gif',
    ico => 'image/x-icon', webp => 'image/webp', txt => 'text/plain; charset=utf-8',
    md => 'text/plain; charset=utf-8', woff => 'font/woff', woff2 => 'font/woff2',
    mp3 => 'audio/mpeg', wav => 'audio/wav', ogg => 'audio/ogg',
);

sub slurp { my ($f) = @_; open(my $h, '<:raw', $f) or return undef; local $/; my $c = <$h>; close $h; return $c; }
sub spit  { my ($f, $c) = @_; open(my $h, '>:raw', $f) or die "write $f: $!"; print $h $c; close $h; }

sub save_data {
    my ($body) = @_;
    if (-e $DATA) {
        mkdir $BACKUPS unless -d $BACKUPS;
        my $bk = "$BACKUPS/appdata-" . strftime('%Y-%m-%d', localtime) . ".json";
        unless (-e $bk) {
            copy($DATA, $bk);
            my @all = sort { $b cmp $a } glob("$BACKUPS/appdata-*.json");
            unlink @all[14 .. $#all] if @all > 14;
        }
    }
    my $tmp = "$DATA.tmp";
    spit($tmp, $body);
    rename $tmp, $DATA or die "rename: $!";
}

sub respond {
    my ($c, $method, $status, $body, $ctype) = @_;
    $body  = '' unless defined $body;
    $ctype ||= 'text/plain; charset=utf-8';
    my %text = (200 => 'OK', 204 => 'No Content', 400 => 'Bad Request', 403 => 'Forbidden',
                404 => 'Not Found', 405 => 'Method Not Allowed', 409 => 'Conflict');
    my $h = "HTTP/1.1 $status " . ($text{$status} || 'OK') . "\r\n"
          . "Content-Type: $ctype\r\nContent-Length: " . length($body) . "\r\n"
          . "X-AppHub: 2\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type\r\n"
          . "Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS\r\nAccess-Control-Allow-Private-Network: true\r\n"
          . "Cache-Control: no-cache\r\nConnection: close\r\n\r\n";
    print $c $h;
    print $c $body unless $method eq 'HEAD';
}

sub unescape { my ($s) = @_; $s =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/ge; return $s; }

sub handle {
    my ($c) = @_;
    binmode $c;
    my $sel = IO::Select->new($c);
    return unless $sel->can_read(10);
    my $line = <$c>;
    return unless defined $line;
    $line =~ s/\r?\n$//;
    my ($method, $target) = split ' ', $line;
    return unless $method && $target;
    my %hdr;
    while (defined(my $l = <$c>)) {
        $l =~ s/\r?\n$//;
        last if $l eq '';
        my ($k, $v) = split /:\s*/, $l, 2;
        $hdr{lc $k} = $v if defined $k;
    }
    my ($path, $query) = split /\?/, $target, 2;
    $query ||= '';
    $path = unescape($path);
    my %q = map { my ($k, $v) = split /=/, $_, 2; ($k => (defined $v ? $v : '')) } grep { length } split /&/, $query;

    return respond($c, $method, 204, '') if $method eq 'OPTIONS';

    if ($method eq 'GET' || $method eq 'HEAD') {
        return respond($c, $method, 200, 'ok') if $path eq '/api/ping';
        if ($path eq '/api/data') {
            my $d = slurp($DATA);
            return defined $d ? respond($c, $method, 200, $d, 'application/json; charset=utf-8')
                              : respond($c, $method, 404, 'no data');
        }
        if ($path eq '/api/backups') {
            # Liste der taeglichen Sicherungen (neueste zuerst) als JSON
            my @all = sort { $b cmp $a } glob("$BACKUPS/appdata-*.json");
            my @items = map { my $n = (split m{/}, $_)[-1]; { name => $n, size => (-s $_) || 0, t => ((stat $_)[9] || 0) * 1000 } } @all;
            return respond($c, $method, 200, JSON::PP->new->utf8->encode(\@items), 'application/json; charset=utf-8');
        }
        if ($path =~ m{^/api/backup/(appdata-[0-9A-Za-z\-]+\.json)$}) {
            my $bf = "$BACKUPS/$1";
            my $d = slurp($bf);
            return defined $d ? respond($c, $method, 200, $d, 'application/json; charset=utf-8') : respond($c, $method, 404, 'not found');
        }
        $path = '/AppHub.html' if $path eq '/';
        (my $rel = $path) =~ s{\\}{/}g;
        my @parts = grep { length } split m{/}, $rel;
        return respond($c, $method, 403, 'forbidden')
            if (grep { /^\./ } @parts) || (@parts && ($parts[0] =~ /^appdata/ || $parts[0] eq 'backups'));
        my $full = abs_path(File::Spec->catfile($ROOT, @parts));
        return respond($c, $method, 404, 'not found') unless defined $full && index($full, $ROOT) == 0 && -f $full;
        my ($ext) = $full =~ /\.([^.\/]+)$/;
        my $ct = $MIME{lc($ext || '')} || 'application/octet-stream';
        return respond($c, $method, 200, slurp($full), $ct);
    }

    if ($method eq 'POST' && $path eq '/api/update') {
        # Updater (update-mac.sh) anstossen und auf das Ergebnis warten; gibt die dann gueltige Version zurueck
        return respond($c, $method, 404, 'no updater') unless -f "$ROOT/update-mac.sh";
        system('bash', "$ROOT/update-mac.sh", $ROOT);
        my $v = slurp("$ROOT/version.txt");
        $v = '' unless defined $v;
        $v =~ s/\s+//g;
        return respond($c, $method, 200, $v);
    }

    if ($method eq 'PUT' || $method eq 'POST') {
        return respond($c, $method, 404, 'not found') unless $path eq '/api/data';
        my $len = $hdr{'content-length'} || 0;
        my $body = '';
        while (length($body) < $len) {
            my $n = read($c, my $buf, $len - length($body));
            last unless $n;
            $body .= $buf;
        }
        return respond($c, $method, 409, 'exists') if ($q{ifmissing} || '') eq '1' && -e $DATA;
        return respond($c, $method, 400, 'bad body') unless $body =~ /^\s*\{/;
        if (($q{migrate} || '') eq '1') {
            # einmalige Uebernahme der alten Browser-Daten: neue Werte gewinnen, vorhandene Zusatzschluessel bleiben
            return respond($c, $method, 409, 'already migrated') if -e $MARK;
            my $json = JSON::PP->new->utf8->allow_nonref;
            my $out = eval {
                my $inc = $json->decode($body);
                my %data;
                if (-e $DATA) { my $old = $json->decode(slurp($DATA)); %data = %{ $old->{data} || {} }; }
                my $new = $inc->{data} || {};
                $data{$_} = $new->{$_} for keys %$new;
                $json->encode({ v => 1, t => time() * 1000, data => \%data });
            };
            return respond($c, $method, 400, 'bad json') unless defined $out;
            save_data($out);
            spit($MARK, 'ok');
            return respond($c, $method, 200, 'migrated');
        }
        save_data($body);
        return respond($c, $method, 200, 'saved');
    }
    respond($c, $method, 405, 'method not allowed');
}

my $srv = IO::Socket::INET->new(LocalAddr => '127.0.0.1', LocalPort => $port, Listen => 50, ReuseAddr => 1, Proto => 'tcp')
    or die "Port $port konnte nicht geoeffnet werden: $!\n";
print "AppHub laeuft auf http://localhost:$port/  (Daten: $DATA)\n";

# "localhost" kann auf ::1 (IPv6) zeigen -> dort zusaetzlich lauschen, falls moeglich
my @socks = ($srv);
eval {
    require IO::Socket::IP;
    my $s6 = IO::Socket::IP->new(LocalAddr => '::1', LocalPort => $port, Listen => 50, ReuseAddr => 1, V6Only => 1);
    push @socks, $s6 if $s6;
};

$SIG{CHLD} = 'IGNORE';
$SIG{PIPE} = 'IGNORE';
my $sel = IO::Select->new(@socks);
my $last = time();
while (1) {
    if (my @ready = $sel->can_read(30)) {
        my $lsn = $ready[0];
        my $c = $lsn->accept or next;
        $last = time();
        my $pid = fork();
        if (!defined $pid) { eval { handle($c) }; close $c; next; }
        if ($pid == 0) { close $_ for @socks; eval { handle($c) }; close $c; exit 0; }
        close $c;
    } elsif ($idle > 0 && time() - $last > $idle * 60) {
        exit 0;
    }
}
