set namedArgs = WScript.Arguments.Named

sMethod = namedArgs.Item("Method")
sUrl = namedArgs.Item("URL")
sRequest = namedArgs.Item("Query")
HTTPPost sMethod, sUrl, sRequest
Function HTTPPost(sMethod, sUrl, sRequest)
    If sMethod = "POST" Then
        oHTTP.open "POST", sUrl, True
        oHTTP.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
        oHTTP.setRequestHeader "Content-Length", Len(sRequest)
        oHTTP.send sRequest
    ElseIf sMethod = "GET" Then
        set oHTTP = CreateObject("MSXML2.ServerXMLHTTP.3.0")
        oHTTP.setTimeouts 5000, 5000, 5000, 5000
        oHTTP.setOption 2, 13056
        oHTTP.open "GET", sUrl, False
        oHTTP.send
        HTTPPost = oHTTP.responseText
        WScript.Echo HTTPPost
        WScript.Quit
    End If
End Function
