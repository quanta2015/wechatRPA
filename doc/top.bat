$User32 = Add-Type -Debug:$False -MemberDefinition '
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X,int Y, int cx, int cy, uint uFlags);
' -Name "User32Functions" -namespace User32Functions -PassThru

$Handle = (Get-Process -Name powershell).MainWindowHandle
[Void]$User32::SetWindowPos($Handle, -1, 0, 0, 0, 0, 0x53)